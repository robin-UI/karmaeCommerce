const db = require("../config/connection")
const collection = require("../config/collections")
var objectId = require("mongodb").ObjectId;
var Handlebars = require("handlebars");
const { response } = require("express");

Handlebars.registerHelper("inc", function (value, options) {
    return parseInt(value) + 1;
});

module.exports = {
    
    getAllProducts: (proId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTIONS)
                .find()
                .toArray();
            resolve(products);
        });
    },

    wishListProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishArray = await db
                .get()
                .collection(collection.WISHLIST_COLLECTION)
                .findOne({ userId: objectId(userId) });
            wishArray = wishArray?.products
            resolve(wishArray)
        });
    },

    getUserCount: () => {
        return new Promise(async (resolve, reject) => {
            let userCount = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .countDocuments();
            resolve(userCount);
        });
    },

    getProductCount: () => {
        return new Promise(async (resolve, reject) => {
            let productCount = await db
                .get()
                .collection(collection.PRODUCT_COLLECTIONS)
                .count();
            resolve(productCount);
        });
    },

    getTotalRevenue: () => {
        return new Promise(async (resolve, reject) => {
            let totalRevenue = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            cancel: false,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            grandTotal: {
                                $sum: "$totalAmount",
                            },
                        },
                    },
                    {
                        $project: {
                            grandTotal: 1,
                        },
                    },
                ])
                .toArray();

            resolve(totalRevenue[0]?.grandTotal);
        });
    },

    getOrdersCount: () => {
        return new Promise(async (resolve, reject) => {
            let ordersCount = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .count();
            resolve(ordersCount);
        });
    },

    getPaymentMethodNums: (paymentMethod) => {
        return new Promise(async (resolve, reject) => {
            let response = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            paymentMethod: paymentMethod,
                        },
                    },
                    {
                        $count: "count",
                    },
                ])
                .toArray();
            resolve(response);
        });
    },

    getChartData: async (year) => {
        year = parseInt(year);
        let data = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match: { cancel: false },
                },
                {
                    $group: {
                        _id: {
                            truncatedOrderDate: {
                                $dateTrunc: {
                                    date: "$date",
                                    unit: "month",
                                    binSize: 1,
                                },
                            },
                        },
                        sumQuantity: {
                            $sum: "$totalAmount",
                        },
                    },
                },
                {
                    $project: {
                        month: {
                            $month: "$_id.truncatedOrderDate",
                        },
                        year: { $year: "$_id.truncatedOrderDate" },
                        sumQuantity: 1,
                    },
                },
                {
                    $match: {
                        year: year,
                    },
                },
                {
                    $sort: {
                        month: 1,
                    },
                },
            ])
            .toArray();

        if (data.length < 12) {
            for (let i = 1; i <= 12; i++) {
                let datain = true;
                for (let j = 0; j < data.length; j++) {
                    if (data[j].month === i) {
                        datain = null;
                    }
                }

                if (datain) {
                    data.push({ sumQuantity: 0, month: i });
                }
            }
        }

        data.sort(function (a, b) {
            return a.month - b.month;
        });
        let linChartData = [];
        data.map((element) => {
            let a = element.sumQuantity;
            linChartData.push(a);
        });

        return linChartData;
    },

    getYear: () => {
        return new Promise(async (resolve, reject) => {
            let listedYears = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $group: { _id: { year: { $year: "$date" } } },
                    },
                    {
                        $project: { year: "$_id.year", _id: 0 },
                    },
                    {
                        $sort: { year: -1 },
                    },
                ])
                .toArray();
            resolve(listedYears);
        });
    },

    getYearlySalesReport: async () => {
        let report = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match: {
                        cancel: false,
                    },
                },
                {
                    $group: {
                        _id: {
                            truncatedOrderDate: {
                                $dateTrunc: {
                                    date: "$date",
                                    unit: "year",
                                    binSize: 1,
                                },
                            },
                        },
                        grandTotal: {
                            $sum: "$totalAmount",
                        },
                    },
                },
                {
                    $project: {
                        year: {
                            $year: "$_id.truncatedOrderDate",
                        },
                        grandTotal: 1,
                    },
                },
                {
                    $sort: {
                        year: -1,
                    },
                },
            ])
            .toArray();
        return report;
    },

    getWeeklySalesReport: async (yearValue) => {
        yearValue = parseInt(yearValue);
        let report = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match: {
                        cancel: false,
                    },
                },
                {
                    $group: {
                        _id: {
                            truncatedOrderDate: {
                                $dateTrunc: {
                                    date: "$date",
                                    unit: "week",
                                    binSize: 1,
                                },
                            },
                        },
                        grandTotal: {
                            $sum: "$totalAmount",
                        },
                    },
                },
                {
                    $project: {
                        year: {
                            $year: "$_id.truncatedOrderDate",
                        },
                        week: {
                            $week: "$_id.truncatedOrderDate",
                        },
                        grandTotal: 1,
                    },
                },
                {
                    $match: {
                        year: yearValue,
                    },
                },
                {
                    $sort: {
                        week: 1,
                    },
                },
            ])
            .toArray();
        return report;
    },

    getMonthlySalesReport: async (yearValue) => {
        yearValue = parseInt(yearValue);
        let report = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match: {
                        cancel: false,
                    },
                },
                {
                    $group: {
                        _id: {
                            truncatedOrderDate: {
                                $dateTrunc: {
                                    date: "$date",
                                    unit: "month",
                                    binSize: 1,
                                },
                            },
                        },
                        grandTotal: {
                            $sum: "$totalAmount",
                        },
                    },
                },
                {
                    $project: {
                        month: {
                            $month: "$_id.truncatedOrderDate",
                        },
                        year: { $year: "$_id.truncatedOrderDate" },
                        grandTotal: 1,
                    },
                },
                {
                    $match: {
                        year: yearValue,
                    },
                },
                {
                    $sort: {
                        month: 1,
                    },
                },
            ])
            .toArray();

        if (report.length < 12) {
            for (let i = 1; i <= 12; i++) {
                let datain = true;
                for (let j = 0; j < report.length; j++) {
                    if (report[j].month === i) {
                        datain = null;
                    }
                }
                if (datain) {
                    report.push({ grandTotal: 0, month: i });
                }
            }
        }
        await report.sort(function (a, b) {
            return a.month - b.month;
        });
        return report;
    },

    getAllBanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await db
                .get()
                .collection(collection.BANNER_COLLECTION)
                .find()
                .toArray();
            resolve(banner);
        });
    },

    getOneBanner: (bannerId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.BANNER_COLLECTION)
                .findOne({ _id: objectId(bannerId) })
                .then((banner) => {
                    resolve(banner);
                });
        });
    },

    updateBanner: (bannerId, body) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.BANNER_COLLECTION)
                .updateOne(
                    { _id: objectId(bannerId) },
                    {
                        $set: {
                            Name: body.Name,
                            text: body.bannerText,
                            description: body.description,
                            Images: body.Images,
                        },
                    }
                );
            resolve();
        });
    },

    addBanner: (body) => {
        return new Promise((resolve, reject) => {
            let proObj = {
                Name: body.Name,
                text: body.bannerText,
                description: body.description,
                Images: body.Images,
            };
            db.get()
                .collection(collection.BANNER_COLLECTION)
                .insertOne(proObj)
                .then(() => {
                    resolve();
                });
        });
    },

    deleteBanner: (bannerData) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.BANNER_COLLECTION)
                .deleteOne({ _id: objectId(bannerData) })
                .then(() => {
                    resolve();
                });
        });
    },

    //Add category
    addCategory: (userData) => {
        return new Promise(async (resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_CATEGORY)
                .insertOne(userData)
                .then((data) => {
                    resolve(data.insertedId);
                });
        });
    },
    //filter products according to category
    categoryFilter: (categoryId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTIONS)
                .find({ categoryId: objectId(categoryId) })
                .toArray();
            resolve(products);
        });
    },

    getCategories: () => {
        return new Promise(async (resolve, reject) => {
            let categories = await db
                .get()
                .collection(collection.PRODUCT_CATEGORY)
                .find()
                .toArray();
            resolve(categories);
        });
    },

    getSingleCategory: (editProdId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_CATEGORY)
                .findOne({ _id: objectId(editProdId) })
                .then((category) => {
                    resolve(category);
                });
        });
    },

    updateCategory: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_CATEGORY)
                .updateOne(
                    { _id: objectId(proId) },
                    {
                        $set: {
                            category: proDetails.category,
                        },
                    }
                )
                .then((response) => {
                    resolve(response);
                });
        });
    },

    deleteCategory: (proId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_CATEGORY)
                .deleteOne({ _id: objectId(proId) })
                .then((response) => {
                    resolve(response);
                });
        });
    },

    addOfferCategory: (body, catId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_CATEGORY)
                .updateOne(
                    { _id: objectId(catId) },
                    {
                        $set: {
                            percentage: body.percentage,
                            offername: body.offername,
                        },
                    }
                );
            resolve();
        });
    },

    activateCategoryOffer: (catId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTIONS)
                .aggregate([
                    {
                        $match: {
                            categoryId: objectId(catId),
                        },
                    },
                    {
                        $project: {
                            name: 1,
                            categoryId: 1,
                            price: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_CATEGORY,
                            localField: "categoryId",
                            foreignField: "_id",
                            as: "Category",
                        },
                    },
                    {
                        $project: {
                            name: 1,
                            categoryName: "$Category.category",
                            Categoryoffername: "$Category.offername",
                            Categorypercentage: "$Category.percentage",
                            price: 1,
                        },
                    },
                ])
                .toArray();
            //mapping
            products.map(async (prod) => {
                let Price = parseInt(prod.price);
                let discount = (Price * prod.Categorypercentage) / 100;
                Price = parseInt(Price - parseInt(discount));

                await db
                    .get()
                    .collection(collection.PRODUCT_COLLECTIONS)
                    .updateMany(
                        { _id: objectId(prod._id) },
                        {
                            $set: {
                                price: Price,
                                offername: prod.Categoryoffername,
                                discountprice: discount,
                                discountpercentage: prod.Categorypercentage,
                                categoryOffer: true,
                            },
                        }
                    );
            });
            resolve();
        });
    },

    deactivateCategoryOffer: (catId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTIONS)
                .aggregate([
                    {
                        $match: {
                            categoryId: objectId(catId),
                        },
                    },
                    {
                        $project: {
                            name: 1,
                            categoryId: 1,
                            price: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_CATEGORY,
                            localField: "categoryId",
                            foreignField: "_id",
                            as: "Category",
                        },
                    },
                    {
                        $project: {
                            name: 1,
                            categoryName: "$Category.category",
                            Categoryoffername: "$Category.offername",
                            Categorypercentage: "$Category.percentage",
                            price: 1,
                        },
                    },
                ])
                .toArray();
            //mapping
            products.map(async (prod) => {
                let Price = parseInt(prod.price);
                let discount = (prod.price * prod.Categorypercentage) / 100;
                Price = parseInt(Price + parseInt(discount));
                let discount1 = (Price * 5) / 100;
                let defaultpercentage = "5";

                await db
                    .get()
                    .collection(collection.PRODUCT_COLLECTIONS)
                    .updateMany(
                        { _id: objectId(prod._id) },
                        {
                            $set: {
                                price: Price,
                                offername: prod.Categoryoffername,
                                discountprice: discount1,
                                discountpercentage: [defaultpercentage],
                                categoryOffer: false
                            },
                        }
                    );
            });
        });
    },

    changeOfferStatus: (catId, newOffer) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_CATEGORY)
                .updateOne(
                    { _id: objectId(catId) },
                    {
                        $set: {
                            offer: newOffer,
                        },
                    }
                );
            response.status = true;
            resolve(response);
        });
    },

    //ADD-PRODUCT
    addItem: (body) => {
        console.log(body);
        return new Promise(async (resolve, reject) => {
            let Category = await db
                .get()
                .collection(collection.PRODUCT_CATEGORY)
                .findOne({ category: body.category });
            console.log(Category);
            let proObj = {
                name: body.name,
                category: body.category,
                categoryId: objectId(Category._id),
                price: body.price,
                description: body.description,
                Image: body.Image,
                discountpercentage: ["5"],
                offername: [""],
            };

            db.get()
                .collection(collection.PRODUCT_COLLECTIONS)
                .insertOne(proObj)
                .then(() => {
                    resolve();
                });
        });
    },

    //delete product
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_COLLECTIONS)
                .deleteOne({ _id: objectId(prodId) })
                .then((response) => {
                    resolve(response);
                });
        });
    },

    getProductData: (ProductId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_COLLECTIONS)
                .findOne({ _id: objectId(ProductId) })
                .then((productData) => {
                    resolve(productData);
                });
        });
    },

    updateProduct: (proId, productDetails) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_COLLECTIONS)
                .updateOne(
                    { _id: objectId(proId) },
                    {
                        $set: {
                            name: productDetails.name,
                            category: productDetails.category,
                            description: productDetails.description,
                            price: productDetails.price,
                            Image: productDetails.Image,
                        },
                    }
                )
                .then((response) => {
                    resolve(response);
                });
        });
    },

    //admin-orders
    getOrders: () => {
        return new Promise(async (resolve, reject) => {
            let Items = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .find()
                .sort({ date: -1 })
                .toArray();
            resolve(Items);
        });
    },

    changeOrderStatus: (orderId, status) => {
        return new Promise((resolve, reject) => {
            if (status == "delivered") {
                db.get()
                    .collection(collection.ORDER_COLLECTION)
                    .updateOne(
                        { _id: objectId(orderId) },
                        {
                            $set: {
                                paymentstatus: status,
                                delivered: true,
                            },
                        }
                    );
                resolve({ statusChange: true });
            } else if (status == "cancelled") {
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
                    );
                resolve({ statusChange: true });
            } else {
                db.get()
                    .collection(collection.ORDER_COLLECTION)
                    .updateOne(
                        { _id: objectId(orderId) },
                        {
                            $set: {
                                paymentstatus: status,
                            },
                        }
                    );
                resolve({ statusChange: true });
            }
        });
    },

    //coupons section
    addCoupon: (couponData) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.COUPON_COLLECTION)
                .insertOne(couponData)
                .then((data) => {
                    resolve(data.insertedId);
                });
        });
    },

    getAllCoupon: () => {
        return new Promise(async (resolve, reject) => {
            let coupon = await db
                .get()
                .collection(collection.COUPON_COLLECTION)
                .find()
                .toArray();
            resolve(coupon);
        });
    },

    deleteCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.COUPON_COLLECTION)
                .deleteOne({ _id: objectId(couponId) });
            resolve();
        });
    },
}