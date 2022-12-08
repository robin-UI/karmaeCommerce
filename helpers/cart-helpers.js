const db = require("../config/connection")
const collection = require("../config/collections")
var objectId = require("mongodb").ObjectId;

module.exports = {
    addToCart: (proId, userId) => {
      let proObj = {
        item: objectId(proId),
        quantity: 1,
      };
      return new Promise(async (resolve, reject) => {
        if (!userId) {
          resolve({ status: false });
        }
        let userCart = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .findOne({ user: objectId(userId) });
  
        if (userCart) {
          let proExist = userCart.products.findIndex(
            (product) => product.item == proId
          );
  
          if (proExist != -1) {
            db.get()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                { user: objectId(userId), "products.item": objectId(proId) },
                {
                  $inc: { "products.$.quantity": 1 },
                }
              )
              .then((response) => {
                resolve({ alertOnly: true });
              });
          } else {
            db.get()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                { user: objectId(userId) },
                {
                  $push: { products: proObj },
                }
              )
              .then((response) => {
                resolve({ status: true });
              });
          }
        } else {
          let cartObj = {
            user: objectId(userId),
            products: [proObj],
          };
          db.get()
            .collection(collection.CART_COLLECTION)
            .insertOne(cartObj)
            .then((response) => {
              resolve({ status: true });
            });
        }
      });
    },
  
    getCartProducts: (userId) => {
      return new Promise(async (resolve, reject) => {
        let cartItems = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: objectId(userId) },
            },
            {
              $unwind: "$products",
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTIONS,
                localField: "item",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                product: {
                  $arrayElemAt: ["$product", 0],
                },
              },
            },
          ])
          .toArray();
        resolve(cartItems);
      });
    },
  
    getCartCount: (userId) => {
      return new Promise(async (resolve, reject) => {
        let cartCount = 0;
        let cart = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .findOne({ user: objectId(userId) });
        if (cart) {
          cartCount = cart.products.length;
        }
        resolve(cartCount);
      });
    },
  
    changeProductQuantity: (details) => {
      details.count = parseInt(details.count);
      details.quantity = parseInt(details.quantity);
      let response = {};
      return new Promise((resolve, reject) => {
        if (details.count == -1 && details.quantity == 1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { _id: objectId(details.cart) },
              {
                $pull: { products: { item: objectId(details.product) } },
              }
            )
            .then((response) => {
              resolve({ removeProduct: true });
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              {
                _id: objectId(details.cart),
                "products.item": objectId(details.product),
              },
              {
                $inc: {
                  "products.$.quantity": details.count,
                },
              }
            );
  
          db.get()
            .collection(collection.CART_COLLECTION)
            .aggregate([
              {
                $match: { _id: objectId(details.cart) },
              },
              {
                $unwind: "$products",
              },
              {
                $match: {
                  "products.item": objectId(details.product),
                },
              },
              {
                $project: {
                  quantity: "$products.quantity",
                  productId: '$products.item'
                },
              },
              {
                $lookup:{
                  from:collection.PRODUCT_COLLECTIONS,
                  localField: 'productId' ,
                  foreignField: '_id',
                  as:'product'
                }
              },
              {
                $project: {
                  quantity: 1,
                  productData:{ $arrayElemAt: ["$product", 0] },
                }
              },
              {
                $project: {
                  quantity: 1,
                  prodPrice: '$productData.price',
                }
              },
              {
                $group:{
                  _id:null,
                  subTotal: {
                    $sum: {
                      $multiply: [
                        { $toInt: '$quantity'},
                        {$toInt:  '$prodPrice'}
                      ]
                    }
                  },
                }
              },
              
            ])
            .toArray()
            .then((data) => {
              response.subTotal = data[0].subTotal
              resolve(response);
            });
  
          
        }
      });
    },
  
    deleteCartProduct: (data) => {
      return new Promise((resolve, reject) => {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(data.cartId),
            },
            { $pull: { products: { item: objectId(data.productId) } } }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      });
    },
    couponCheck: (userId, body) => {
      let response = {};
      return new Promise(async (resolve, reject) => {
        let couponcode = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .findOne({ couponname: body.coupon });
        if (couponcode) {
          let user = await db
            .get()
            .collection(collection.COUPON_COLLECTION)
            .findOne({ couponname: body.coupon, user: objectId(userId) });
          if (user) {
            response.coupon = false;
            response.usedcoupon = true;
            console.log("coupon already used");
            resolve(response);
          } else {
            let currentDate = new Date();
            let endDate = new Date(couponcode.enddate);
            if (currentDate <= endDate) {
              let total = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .aggregate([
                  {
                    $match: { user: objectId(userId) },
                  },
                  {
                    $unwind: "$products",
                  },
                  {
                    $project: {
                      item: "$products.item",
                      quantity: "$products.quantity",
                    },
                  },
                  {
                    $lookup: {
                      from: collection.PRODUCT_COLLECTIONS,
                      localField: "item",
                      foreignField: "_id",
                      as: "product",
                    },
                  },
                  {
                    $project: {
                      item: 1,
                      quantity: 1,
                      product: { $arrayElemAt: ["$product", 0] },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      total: {
                        $sum: {
                          $multiply: [
                            { $toInt: "$quantity" },
                            { $toInt: "$product.price" },
                          ],
                        },
                      },
                    },
                  },
                ])
                .toArray();
              let total1 = total[0].total;
  
              response.discountamount = (couponcode.percentage * total1) / 100;
              response.grandtotal = total1 - response.discountamount;
              response.coupon = true;
              resolve(response);
            } else {
              response.expired = true;
              console.log("coupon expired");
              resolve(response);
            }
          }
        } else {
          console.log("invalid coupon");
          resolve(response);
        }
      });
    },
    userAppliedCoupon: (userId, coupon) => {
      return new Promise((resolve, reject) => {
        db.get()
          .collection(collection.COUPON_COLLECTION)
          .updateOne(
            {
              couponname: coupon,
            },
            {
              $push: {
                user: objectId(userId),
              },
            }
          );
        resolve();
      });
    },
  
    getTotalAmount: (userId) => {
      return new Promise(async (resolve, reject) => {
        let total = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: objectId(userId) },
            },
            {
              $unwind: "$products",
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTIONS,
                localField: "item",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                product: {
                  $arrayElemAt: ["$product", 0],
                },
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $multiply: ["$quantity", { $toInt: "$product.price" }],
                  },
                },
              },
            },
          ])
          .toArray();
        if (total.length != 0) {
          resolve(total[0].total);
        } else {
          resolve();
        }
      });
    },
  
    getCartProductList: (userId) => {
      return new Promise(async (resolve, reject) => {
        let cart = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .findOne({ user: objectId(userId) });
        resolve(cart.products);
      });
    },
  
    getOrderId: (userId) => {
      return new Promise(async (resolve, reject) => {
        let products = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .findOne({ userId: objectId(userId) })
          .then((orderDetails) => {
            resolve(orderDetails);
          });
      });
    },
  };
  