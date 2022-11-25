var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')
const { USERSCOLLECTION } = require('../config/collections')
const { response } = require('express')
const collections = require('../config/collections')
var objectId = require('mongodb').ObjectId
const { ObjectId } = require('mongodb')
const { resolve } = require('path')
const Razorpay = require('razorpay');

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

module.exports = {
    // pagination to find page count 
    viewProdCount: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collections.PRODUCT).find().count()

            // //console.log(count , " counttttt")
            resolve(count)
        })
    },

    dosignup: (userData) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let email = await db.get().collection(collection.USERSCOLLECTION).findOne({ email: userData.email })
            let phone = await db.get().collection(collections.USERSCOLLECTION).findOne({ phone: userData.phone })

            if (email && phone) {
                response.status = true;
                resolve(response)
            }

            else {
                userData.wallet = 0

                userData.password = await bcrypt.hash(userData.password, 10)
                // //console.log(userData.password);
                userData.state = true;

                if (userData.referralcode === "") {
                    let userdata = {

                        name: userData.name,
                        phone: userData.phone,
                        email: userData.email,
                        password: userData.password,
                        wallet: userData.wallet,
                        state: userData.state,
                        referral: '' + (Math.floor(Math.random() * 90000) + 10000)

                    }
                    // //console.log(userdata);

                    await db.get().collection(collection.USERSCOLLECTION).insertOne(userdata).then(async (data) => {

                        resolve(data.insertedId)


                    })

                } else {

                    // //console.log(userData.referralcode, "referral coede")

                    let referralCheck = await db.get().collection(collections.USERSCOLLECTION).findOne({ referral: userData.referralcode })
                    // //console.log(referralCheck, "referral check")
                    if (referralCheck) {
                        // //console.log("refferal")
                        let userdata = {

                            name: userData.name,
                            phone: userData.phone,
                            email: userData.email,
                            password: userData.password,
                            wallet: 100,
                            state: userData.state,
                            referral: "" + (Math.floor(Math.random() * 90000) + 10000)

                        }
                        await db.get().collection(collection.USERSCOLLECTION).insertOne(userdata).then(async (data) => {
                            let refer = await db.get().collection(collections.USERSCOLLECTION).updateOne({ referral: userData.referralcode },
                                {
                                    $set: {
                                        wallet: referralCheck.wallet + 100
                                    }
                                })

                            resolve(data.insertedId)

                        })
                        response.status = false
                        resolve(response)

                    } else {

                        // //console.log("hiiiiiii")
                        response.referral = true
                        resolve(response)
                    }

                }

            }
        })

    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            userData.state = true
            let user = await db.get().collection(collections.USERSCOLLECTION).findOne({ $and: [{ email: userData.email, state: userData.state }] })
            //   //console.log(user +"userasa");

            if (user) {
                // //console.log(user);
                bcrypt.compare(userData.password, user.password).then((status) => {
                    // //console.log(status);
                    if (status) {
                        // //console.log("login sucess")
                        response.user = user;
                        response.user.status = true
                        response.status = true;
                        resolve(response)
                    }
                    else {
                        // //console.log("password wrong")
                        resolve({ status: false });
                    }
                })
            } else {
                // //console.log("user not found")
                resolve({ status: false })
            }
        })
    },


    hotProd: () => {
        return new Promise(async (resolve, reject) => {

            let hotProd = await db.get().collection(collections.PRODUCT).find().limit(8).toArray()
            resolve(hotProd)

        })

    },

    viewBanner: () => {
        return new Promise(async (resolve, reject) => {
            let banImg = await db.get().collection(collections.ADD_BANNER).find().toArray()
            resolve(banImg)
        })

    },

    getCategoryProduct: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collections.CATEGORY).find().toArray()
            // //console.log(category.category)
            resolve(category)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collections.USERCART).findOne({ user: objectId(userId) })
            // //console.log(cart)
            if (cart) {
                // let proExist = userCart.products.findIndex(products => products.cart == ProId)
                count = cart.products.length
                // //console.log(count, " count  ")
                resolve(count)
            }
            else {
                resolve(count)
            }
        })

    },

    getLimitProd: (startIndex, Limit) => {

        // //console.log(startIndex , Limit , (startIndex-1)*Limit ," i am here ");
        return new Promise(async (resolve, reject) => {

            let products = await db.get().collection(collections.PRODUCT).find().skip((startIndex - 1) * Limit).limit(Limit).toArray()

            //    //console.log(products , "aaaaaaaaaaaaaaaaaaaaaaaaa")
            resolve(products)
        })
    },

    viewSingleProd: (ProdId) => {
        return new Promise(async (resolve, reject) => {
            let productName = await db.get().collection(collections.PRODUCT).aggregate([
                {
                    $lookup: {
                        from: collections.CATEGORY,
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                }, {

                    $match: { _id: objectId(ProdId) }
                },

                {
                    $project: {
                        category: { $arrayElemAt: ['$category', 0] },
                        productName: 1,
                        productid: 1,
                        price: 1,
                        image: 1,
                        textarea: 1,
                        offerper: 1,
                        extraPrice: 1
                    }
                }

            ]).toArray()
            //console.log(productName, "gghfgh");
            resolve(productName[0])
        })
    },

    relatedProd: (cat) => {
        return new Promise(async (resolve, reject) => {

            let prod = await db.get().collection(collections.PRODUCT).find({ category: cat }).limit(5).toArray()

            resolve(prod)
        })

    },

    addToCart: (ProId, userId) => {
        let prodObj = {
            item: objectId(ProId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {

            let userCart = await db.get().collection(collections.USERCART).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(products => products.item == objectId(ProId))
                //console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collections.USERCART).updateOne({
                        'products.item': objectId(ProId)
                    },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve({ status: false })
                    })
                }
                else {
                    db.get().collection(collections.USERCART).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: prodObj }
                        }
                    ).then(() => {
                        resolve({ status: true })
                    })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collections.USERCART).insertOne(cartObj).then((response) => {
                    //console.log(response)
                    resolve({ status: true })
                })
            }
        })
    },

    getCartProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.USERCART).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }

            ]).toArray()
            //console.log(cartItems)
            resolve(cartItems)
        })
    },

    getAmountTotal: (userId) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collections.USERCART).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }


                    }
                },

                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: [
                                    {
                                        $toInt: '$quantity'
                                    }, {
                                        $toInt: '$product.price'
                                    }
                                ]
                            }
                        }
                    }
                }


            ]).toArray()
            // //console.log(total[0].total,"total")
            if (total.length != 0) {
                resolve(total[0].total)
            } else {
                resolve()
            }

        })

    },

    getAmountArray: (userId) => {
        return new Promise(async (resolve, reject) => {
            let subTotal = await db.get().collection(collections.USERCART).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                },
                {
                    $project: {
                        total: {
                            $multiply: [
                                {
                                    $toInt: '$quantity'
                                }, {
                                    $toInt: '$product.price'
                                }
                            ]
                        }
                    }
                }
            ]).toArray()
            //console.log(subTotal, "total single")
            resolve(subTotal)
        })

    },

    deleteCartProduct: (prodId, userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.USERCART).updateOne({ user: objectId(userId) }, {
                $pull: {
                    products:
                    {
                        item: objectId(prodId.product)
                    }
                }
            }).then((responce) => {
                resolve(responce)
            })
        })
    },

    changeProdCount: (details) => {
        count = parseInt(details.count)
        products = parseInt(details.quantity)
        //console.log(details, "details")
        return new Promise(async (resolve, reject) => {

            db.get().collection(collections.USERCART).updateOne({
                _id: objectId(details.cart),
                'products.item': objectId(details.product)
            },
                {

                    $inc: { 'products.$.quantity': count }
                }
            ).then((response) => {
                resolve({ status: true })
            })

        })
    },

    getAmount: (details) => {

        //console.log(details, "details xyz")
        return new Promise(async (resolve, reject) => {

            let subTotal = await db.get().collection(collections.USERCART).aggregate([
                {
                    $match: {
                        user: objectId(details.user)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $match: {
                        item: objectId(details.product)
                    }

                },
                {
                    $lookup: {
                        from: collections.PRODUCT,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                },

                {
                    $project: {
                        total: {
                            $multiply: [
                                {
                                    $toInt: '$quantity'
                                },
                                {
                                    $toInt: '$product.price'
                                }
                            ]
                        }

                    }
                }

            ]).toArray()
            if (subTotal.length != 0) {
                //console.log(subTotal, "total single")
                resolve(subTotal[0].total)
            } else {
                resolve()
            }
        })
    },

    cartCheck: (userId) => {

        return new Promise(async (resolve, reject) => {

            let cartCheck = await db.get().collection(collections.USERCART).findOne({ user: objectId(userId) })
            //console.log(cartCheck)
            if (cartCheck.products == "") {
                let cartProd = true
                //console.log(cartProd, "kbkhkhvkhbddddddddddddddddddd")
                resolve(cartProd)

            } else {


                let cartProduct = (cartCheck.products).length


                let cartProd = false
                //console.log(cartProd, "kbkhkhvkhb")

                resolve(cartProd)
            }
        })
    },

    addAddress: (address, user) => {
        return new Promise(async (resolve, reject) => {
            //console.log(address)
            await db.get().collection(collections.ADDRESS).insertOne({
                user: objectId(user),
                address: address
            })
            resolve(response)
        })
    },


    viewAddress: (user) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.ADDRESS).find({ user: objectId(user) }).toArray().then((response) => {
                //console.log(response)
                resolve(response)
            })
        })
    },

    userProfile: (userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.USERSCOLLECTION).findOne({ _id: objectId(userId) }).then((data) => {
                resolve(data)
            })
        })
    },

    

    getCartProdList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let carts = await db.get().collection(collections.USERCART).findOne({ user: objectId(userId) })
            //console.log(carts.products);
            resolve(carts.products)
        })

    },

    getAmountTotal: (userId) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collections.USERCART).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }


                    }
                },

                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: [

                                    {
                                        $toInt: '$quantity'
                                    }, {
                                        $toInt: '$product.price'
                                    }

                                ]
                            }
                        }
                    }
                }


            ]).toArray()
            // //console.log(total[0].total,"total")
            if (total.length != 0) {
                resolve(total[0].total)
            } else {
                resolve()
            }

        })

    },

    getUserWallet: (userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.USERSCOLLECTION).findOne({ _id: objectId(userId) }).then((data) => {
                resolve(data)
            })
        })
    },

    couponVerify: (user, couponid) => {

        return new Promise(async (resolve, reject) => {

            let response = await db.get().collection(collections.USERCART).findOne({ user: objectId(user), "couponDet.couponID": couponid })

            if (response) {
                response.state = true

                resolve(response)

            } else {


                statee = true
                resolve(statee)
            }


        })
    },

    //    get coupon id before adding to user 
    getOfferId: (offer) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.COUPON).findOne({ couponid: offer }).then((response) => {

                resolve(response)
            })
        })
    },

    AddUserCoupon: (data, user) => {

        return new Promise(async (resolve, reject) => {


            await db.get().collection(collections.USERSCOLLECTION).updateOne({ _id: objectId(user) }, {


                $push: {
                    coupon: objectId(data._id)

                }
            })
        })

    },

    //Add Coupon from amal code
    couponCheck: (userId, body) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
          let couponcode = await db
            .get()
            .collection(collection.COUPON)
            .findOne({ couponname: body.coupon });
          if (couponcode) {
            let user = await db
              .get()
              .collection(collection.COUPON)
              .findOne({ couponname: body.coupon, user: userId });
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
                  .collection(collection.USERCART)
                  .aggregate([
                    {
                      $match: { user: userId },
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
                        from: collection.PRODUCT,
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
    
                //temp
                response.discountamount = (couponcode.percentage * total1) / 100;
                response.grandtotal = total1 - response.discountamount;
                response.coupon = true;
                resolve(response);
                //
    
                // if (total1 >= couponcode.lowercap && total1 <= couponcode.uppercap) {
                //   response.discountamount = (couponcode.percentage * total1) / 100
                //   response.grandtotal = total1 - response.discountamount
                //   response.coupon = true
                //   console.log("discount", response.discountamount);
                //   console.log("grandtotal", response.grandtotal);
                //   resolve(response)
                // } else{
                //   response.small = true
                //   resolve(response)
                // }
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

    substractWallet: (userId) => {

        return new Promise(async (resolve, reject) => {
            let sub = await db.get().collection(collections.USERSCOLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        wallet: 0
                    }
                })
            resolve(sub)
        })
    },

    placeOrder: (
      orderedProducts,
      deliveryAddress,
      total,
      paymentMethod,
      userId,
      discount
    ) => {
      return new Promise((resolve, reject) => {
        let status = paymentMethod === "COD" ? "placed" : "pending";
        let orderObj = {
          userId: userId,
          products: orderedProducts,
          address: deliveryAddress,
          totalAmount: total,
          paymentstatus: status,
          paymentMethod: paymentMethod,
          date: new Date(), //.toUTCString().slice(0, 25),
          dateShort: new Date().toDateString(),
          discountamount: discount,
          cancel: false,
        };
        db.get()
          .collection(collection.ORDER)
          .insertOne(orderObj)
          .then((response) => {
            resolve(response);
          });
      });
    },

    cartClear: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orderDelete = await db.get().collection(collections.USERCART).deleteOne({ user: objectId(userId) })
            resolve(orderDelete)
        })
    },

    generatePayPal: (orderId, totalPrice) => {

        //console.log(orderId, totalPrice)
        return new Promise((resolve, reject) => {
            const create_payment_json = {
                intent: "sale",
                payer: {
                    payment_method: "paypal",
                },
                redirect_urls: {
                    return_url: "http://helgray.ml/order-success",
                    cancel_url: "http://helgray.ml/order-failed",
                },
                transactions: [
                    {
                        item_list: {
                            items: [
                                {
                                    name: "Red Sox Hat",
                                    sku: "001",
                                    price: totalPrice,
                                    currency: "USD",
                                    quantity: 1,
                                },
                            ],
                        },
                        amount: {
                            currency: "USD",
                            total: totalPrice,
                        },
                        description: "Hat for the best team ever",
                    },
                ],
            };

            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {

                    resolve(payment);
                    //console.log(payment)
                }
            });
        });
    },

    changePaymentStatus: (orderId) => {
        //console.log(orderId)

        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.ORDER).updateOne({ _id: ObjectId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }).then((response) => {
                    response.placed = true
                    resolve(response)
                })
        })
    },

    //    check wallet balance for  gerater wallet 
    walletBalance: (wallet, userId) => {
        return new Promise(async (resolve, reject) => {

            await db.get().collection(collections.USERSCOLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {

                        wallet: wallet
                    }
                }).then((response) => {

                    resolve(response)
                })
        })
    },

    placeOrderWallet: (order, products, price, wallet, ogAmount, couponDis) => {

        return new Promise(async (resolve, reject) => {
            //console.log(order, products, price);

            let orders = await db.get().collection(collections.ADDRESS).findOne({ _id: objectId(order.address) })
            let orderObj = {
                deliveryDetails: {

                    firstname: orders.address.firstname,
                    lastname: orders.address.lastname,
                    add1: orders.address.add1,
                    add2: orders.address.add2,
                    country: orders.address.country,
                    states: orders.address.states,
                    pincode: orders.address.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: "wallet",
                products: products,
                wallet: wallet,
                totalAmount: price,
                status: "placed",
                ogAmount: ogAmount,
                couponDis: couponDis,
                date: new Date()
            }

            await db.get().collection(collections.ORDER).insertOne(orderObj).then(async (response) => {
                //   await db.get().collection(collections.USERCART).deleteOne({user:objectId(order.userId)}).then((response)=>{
                //console.log(response)
                resolve(response)
                //    })

            })

        })
    },

    // PAYPAL MONEY 
    converter: (price) => {
        return new Promise((resolve, reject) => {
            let currencyConverter = new CC({
                from: "INR",
                to: "USD",
                amount: price,
                isDecimalComma: false,
            });
            currencyConverter.convert().then((response) => {
                resolve(response);
            });
        });
    },

    generateRazorPay: (orderId, total) => {
      return new Promise((resolve, reject) => {
        instance.orders.create(
          {
            amount: total * 100,
            currency: "INR",
            receipt: orderId,
            notes: {
              key1: "value3",
              key2: "value2",
            },
          },
          (err, order) => {
            if (err) {
              console.log(err);
            } else {
              resolve(order);
            }
          }
        );
      });
    },

    verifyPayment: (details) => {
      return new Promise((resolve, reject) => {
        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", "E7k9AHXMbLuDlCSBBMozjFYt");

        hmac.update(
          details["payment[razorpay_order_id]"] +
            "|" +
            details["payment[razorpay_payment_id]"]
        );
        hmac = hmac.digest("hex");
        if (hmac == details["payment[razorpay_signature]"]) {
          resolve();
        } else {
          reject();
        }
      });
    },

    changePaymentStatus: (orderId) => {
      return new Promise((resolve, reject) => {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .insertOne(
            {
              _id: orderId,
            },
            {
              $set: { paymentstatus: "placed" },
            }
          )
          .then(() => {
            resolve();
          });
      });
    },


    clearCart: (userId) => {
        console.log("clear cart", userId);
      return new Promise((resolve, reject) => {
        db.get()
          .collection(collection.USERCART)
          .deleteOne({ user: objectId(userId) });
          resolve()
      });
    },

}
