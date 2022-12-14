const db = require("../config/connection")
const collection = require("../config/collections")
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
require("dotenv").config();

const RazorPay = require("razorpay");
const paypal = require("paypal-rest-sdk");

var instance = new RazorPay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});
  
paypal.configure({
  mode: "sandbox",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

module.exports = {
    doSignUp: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {};
            let email = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ Email: userData.Email });
            if (email) {
                console.log("same email");
                response.status = true;
                resolve(response);
            } else {
                userData.Password = await bcrypt.hash(userData.Password, 10);
                db.get()
                    .collection(collection.USER_COLLECTION)
                    .insertOne(userData)
                    .then((data) => {
                        let wallObj = {
                            userId: objectId(data.insertedId),
                            wallet: parseInt(0),
                        };
                        db.get()
                            .collection(collection.WALLET_COLLECTION)
                            .insertOne(wallObj);
                        resolve(data.insertedId);
                    });
                console.log("user data inserted in database");
                resolve({ status: false });
            }
        });
    },

    editProfile: (uId, data) => {
        return new Promise(async (resolve, reject) => {
            db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                    { _id: objectId(uId) },

                    {
                        $set: {
                            username: data.Name,
                            Email: data.Email,
                            Phone: data.Phone,
                        },
                    }
                );
            let editedUser = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ _id: objectId(uId) });
            resolve(editedUser);
        });
    },

    resetPassword: (uId, data) => {
        return new Promise(async (resolve, reject) => {
            let user = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ _id: objectId(uId) });

            if (user) {
                bcrypt
                    .compare(data.Currentpassword, user.Password)
                    .then(async (status) => {
                        if (status) {
                            data.Newpassword = await bcrypt.hash(data.Newpassword, 10);

                            db.get()
                                .collection(collection.USER_COLLECTION)
                                .updateOne(
                                    { _id: objectId(uId) },
                                    {
                                        $set: {
                                            Password: data.Newpassword,
                                        },
                                    }
                                );

                            console.log("reset successfull");
                            resolve();
                        } else {
                            err = "Your current password is incorrect";

                            console.log(err);

                            reject(err);
                        }
                    });
            }
        });
    },

    referralCheck: (referralCode) => {
        return new Promise(async (resolve, reject) => {
            let userReferral = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ userReferralCode: referralCode });

            if (userReferral) {
                let userId = userReferral._id;
                await db
                    .get()
                    .collection(collection.WALLET_COLLECTION)
                    .updateOne({ userId: objectId(userId) }, { $inc: { wallet: 1000 } });
            }
            resolve();
        });
    },

    updateWalletCreditReferral: (referralCode, walletAction) => {
        let totalPrice = parseInt(1000);
        return new Promise(async (resolve, reject) => {
            let userReferral = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ userReferralCode: referralCode });

            if (userReferral) {
                let userId = userReferral._id;
                let walletHistory = {
                    order: "referral",
                    status: "credited",
                    amount: totalPrice,
                    date1: new Date().toDateString(),
                    action: walletAction,
                };
                await db
                    .get()
                    .collection(collection.WALLET_COLLECTION)
                    .updateOne(
                        { userId: objectId(userId) },
                        { $push: { walletHistory: walletHistory } }
                    );
            }
            resolve();
        });
    },

    getWallet: (userId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.WALLET_COLLECTION)
                .findOne({ userId: objectId(userId) })
                .then((response) => {
                    resolve(response);
                });
        });
    },

    updateWallet: (userId, walletbalance, orderId, totalPrice) => {
        totalPrice = parseInt(totalPrice);
        let walletHistory = {
            order: objectId(orderId),
            status: "debited",
            amount: totalPrice,
            date1: new Date().toDateString(),
            action: "Product purchase",
        };

        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.WALLET_COLLECTION)
                .updateOne(
                    { userId: objectId(userId) },
                    {
                        $set: {
                            wallet: walletbalance,
                        },
                        $push: {
                            walletHistory: walletHistory,
                        },
                    }
                )
                .then(() => {
                    resolve();
                });
        });
    },

    cancelAmountWallet: (userId, total) => {
        total = parseInt(total);
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.WALLET_COLLECTION)
                .updateOne({ userId: objectId(userId) }, { $inc: { wallet: total } });
            resolve();
        });
    },

    updateWalletCredit: (userId, orderId, totalPrice, walletAction) => {
        return new Promise((resolve, reject) => {
            let walletHistory = {
                order: objectId(orderId),
                status: "credited",
                amount: totalPrice,
                date1: new Date().toDateString(),
                action: walletAction,
            };
            db.get()
                .collection(collection.WALLET_COLLECTION)
                .updateOne(
                    { userId: objectId(userId) },
                    { $push: { walletHistory: walletHistory } }
                );
            resolve();
        });
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {};
            let user = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ Email: userData.Email });

            if (user) {
                if (user.block == true) {
                    resolve({ userBlock: true });
                }
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("login Success");
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        console.log("login failed");
                        resolve({ status: false });
                    }
                });
            } else {
                console.log("login failed");
                resolve({ status: false });
            }
        });
    },

    numberExist: (number) => {
        return new Promise(async (resolve, reject) => {
            let user = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ Phone: number });
            if (user == null) {
                console.log("number doesnot exist in database");
                resolve({ userExist: false });
            } else if (user.block == true) {
                resolve({ userBlock: true });
                console.log("number is blocked");
                resolve({ status: false });
            } else {
                resolve(user);
            }
        });
    },

    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                    { _id: objectId(userId) },
                    {
                        //updating user for blocking feature
                        $set: { block: true },
                    }
                )
                .then((response) => {
                    resolve(response);
                });
        });
    },

    unblockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                    { _id: objectId(userId) },
                    {
                        $set: { block: false },
                    }
                )
                .then((response) => {
                    resolve(response);
                });
        });
    },

    //addAddressUser
    addAddressUser: (addressData, uId) => {
        let addressObj = {
            addressDetail: {
                index: Math.floor(Math.random() * 90000) + 10000,
                Housename: addressData.Housename,
                Streetname: addressData.Streetname,
                State: addressData.State,
                Pin: addressData.Pin,
            },
        };

        return new Promise(async (resolve, reject) => {
            let userExist = await db
                .get()
                .collection(collection.ADDRESS_USER)
                .findOne({ user: objectId(uId) });
            if (userExist) {
                db.get()
                    .collection(collection.ADDRESS_USER)
                    .updateOne(
                        { user: objectId(uId) },
                        {
                            $push: { addressDetail: addressObj.addressDetail },
                        }
                    );
            } else {
                db.get()
                    .collection(collection.ADDRESS_USER)
                    .insertOne({
                        user: objectId(uId),
                        addressDetail: [addressObj.addressDetail],
                    });
            }

            resolve();
        });
    },

    getUserAddress: (userId) => {
        // console.log(userId)
        return new Promise(async (resolve, reject) => {
            let address = await db
                .get()
                .collection(collection.ADDRESS_COLLECTION)
                .aggregate([
                    {
                      $match: { user: objectId(userId) },
                    },
                    {
                      $unwind: "$addressList",
                    },
                    {
                      $project: {
                        addressList: 1,
                      },
                    },
                ])
                .toArray();
            console.log(address)
            resolve(address);
        });
    },

    //get saved single address
    getSingleAddress: (index, uId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db
                .get()
                .collection(collection.ADDRESS_USER)
                .aggregate([
                    {
                        $match: { user: objectId(uId) },
                    },
                    {
                        $unwind: "$addressDetail",
                    },
                    {
                        $match: { "addressDetail.index": index },
                    },
                    {
                        $project: { addressDetail: 1 },
                    },
                ])
                .toArray();

            resolve(address[0].addressDetail);
        });
    },

    addToWishlist: (proId, userId) => {
        let obj = {
            item: objectId(proId),
        };
        let response = {};
        return new Promise(async (resolve, reject) => {
            let wishUserCheck = await db
                .get()
                .collection(collection.WISHLIST_COLLECTION)
                .findOne({ userId: objectId(userId) });
            if (wishUserCheck) {
                let proExist = wishUserCheck.products.findIndex(
                    (product) => product.item == proId
                );
                if (proExist != -1) {
                    db.get()
                        .collection(collection.WISHLIST_COLLECTION)
                        .updateOne(
                            { userId: objectId(userId) },
                            {
                                $pull: { products: { item: obj.item } },
                            }
                        ).then(() => {
                            response.removed = true
                            resolve(response);
                        })

                } else {
                    db.get()
                        .collection(collection.WISHLIST_COLLECTION)
                        .updateOne(
                            { userId: objectId(userId) },
                            {
                                $push: { products: obj },
                            }
                        )
                        .then(() => {
                            response.added = true;
                            resolve(response);
                        });
                }
            } else {
                //orginal schema
                let wishObj = {
                    userId: objectId(userId),
                    products: [obj],
                };
                db.get()
                    .collection(collection.WISHLIST_COLLECTION)
                    .insertOne(wishObj)
                    .then(() => {
                        response.added = true;
                        resolve(response);
                    });
            }
        });
    },

    wishListProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { userId: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: { item: '$products.item' }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(products)
        })
    },

    // addAddress
    addAdrress: (address, userId) => {
        return new Promise(async (resolve, reject) => {
            let Address = await db
                .get()
                .collection(collection.ADDRESS_COLLECTION)
                .findOne({ user: objectId(userId) });
            if (Address) {
                address.index = Address.addressList.length + 1;
                db.get()
                    .collection(collection.ADDRESS_COLLECTION)
                    .updateOne(
                        { user: objectId(userId) },
                        {
                            $push: { addressList: address },
                        }
                    )
                    .then(() => {
                        resolve();
                    });
            } else {
                address.index = 1;
                db.get()
                    .collection(collection.ADDRESS_COLLECTION)
                    .insertOne({ user: objectId(userId), addressList: [address] })
                    .then((response) => {
                        resolve(response);
                    });
            }
        });
    },

    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db
                .get()
                .collection(collection.ADDRESS_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: objectId(userId) },
                    },
                    {
                        $unwind: "$addressList",
                    },
                ])
                .toArray();
            resolve(address);
        });
    },

    getAddress_PlaceOrder: (userId, addressIndex) => {
        return new Promise(async (resolve, reject) => {
            let singleAddress = await db
                .get()
                .collection(collection.ADDRESS_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: objectId(userId) },
                    },
                    {
                        $unwind: "$addressList",
                    },
                    {
                        $match: { "addressList.index": addressIndex },
                    },
                ])
                .toArray();
            resolve(singleAddress[0].addressList);
        });
    },

    priceConvert: (price) => {
        return new Promise((resolve, reject) => {
            let convertPrice = new CC({
                from: "INR",
                to: "USD",
                amount: price,
                isDecimalComma: false,
            });
            convertPrice.convert().then((response) => {
                resolve(response);
            });
        });
    },

    cancelOrderStatus: (orderId, status) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.ORDER_COLLECTION)
                .updateOne(
                    { _id: objectId(orderId) },
                    {
                        $set: {
                            paymentstatus: status,
                            cancel: true,
                        },
                    }
                )
                .then((data) => {
                    resolve(data);
                });
        });
    },

    returnOrderStatus: (orderId, status) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.ORDER_COLLECTION)
                .updateOne(
                    { _id: objectId(orderId) },
                    {
                        $set: {
                            paymentstatus: status,
                            delivered: false,
                            return: true,
                        },
                    }
                )
                .then((data) => {
                    resolve(data);
                });
        });
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
                userId: objectId(userId),
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
                .collection(collection.ORDER_COLLECTION)
                .insertOne(orderObj)
                .then((response) => {
                    resolve(response);
                });
        });
    },

    clearCart: (userId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.CART_COLLECTION)
                .deleteOne({ user: objectId(userId) });
            resolve()
        });
    },

    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            userId: objectId(userId),
                            paymentstatus: {
                                $in: ["cancelled", "placed", "delivered", "Return"],
                            },
                        },
                    },
                ])
                .sort({ date: -1 })
                .toArray();
            db.get()
                .collection(collection.ORDER_COLLECTION)
                .deleteMany({ paymentstatus: "pending" });

            resolve(orders);
        });
    },

    getOrderedProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: objectId(orderId) },
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

            resolve(products);
        });
    },

    getOrderDetails: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.ORDER_COLLECTION)
                .findOne({ _id: objectId(orderId) })
                .then((orderData) => {
                    resolve(orderData);
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

    generatePayPal: (orderId, totalPrice) => {
        let price = totalPrice.toString();
        return new Promise((resolve, reject) => {
            const create_payment_json = {
                intent: "sale",
                payer: {
                    payment_method: "paypal",
                },
                redirect_urls: {
                    return_url: "https://www.cozmoshoes.tk/success",
                    cancel_url: "https://www.cozmoshoes.tk/cancel"    //"http://localhost:3000/cancel", // "http://localhost:3000/success",
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
                }
            });
        });
    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require("crypto");
            let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);

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
                .updateOne(
                    {
                        _id: objectId(orderId),
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

    generateInvoice: (products, orders, userLog) => {
        let data = [];
        products.map((pro) => {
            temp = {
                quantity: pro.quantity,
                description: pro.product.description,
                "tax-rate": 0,
                price: pro.product.price,
            };
            data.push(temp);
        });
        return new Promise((resolve, reject) => {
            const invoiceData = {
                images: {
                    logo: "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",
                    // "background": "https://public.easyinvoice.cloud/pdf/sample-background.pdf"
                },
                sender: {
                    company: "Cozmo",
                    address: "Sample Street 123",
                    zip: "691325",
                    city: "Kochi",
                    country: "India",
                },
                client: {
                    company: orders.address.name,
                    address: orders.address.Housename,
                    zip: orders.address.Pin,
                    city: orders.address.Streetname,
                    country: "India",
                },
                information: {
                    number: orders._id.toString(),
                    date: orders.dateShort,
                    "due-date": orders.dateShort,
                },
                products: [...data],
                "bottom-notice": "Thanks for purchasing from coZmo",
                settings: {
                    currency: "INR",
                    "margin-top": 50,
                    "margin-right": 50,
                    "margin-left": 50,
                    "margin-bottom": 25,
                },
            };

            resolve(invoiceData);
        });
    },
};