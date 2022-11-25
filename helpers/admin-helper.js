var db = require('../config/connection')
var collections = require('../config/collections')
const { response } = require('express')
var objectId = require('mongodb').ObjectId  

module.exports = {

  //Product Section 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒
    addProduct: (productData) => {
        console.log(productData);
        return new Promise(async (resolve, reject) => {
        productData.category = objectId(productData.category)
        productData.ogAmount = productData.price
        let offper = 0   
        productData.offerper = (offper).toString()
        await db.get().collection(collections.PRODUCT).insertOne(productData).then((data) => {
          console.log(data)
          resolve(data)
        })
    })
    },

    viewProducts: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection("products").find().toArray().then((data) => {
                resolve(data)
            })
        })
    },

    getUpdateProduct: (proID) => {
        return new Promise(async (resolve, reject) => {
          await db.get().collection("products").findOne({ _id: objectId(proID) }).then((data) => {
            resolve(data)
          })
        })
    },

    updateProduct: (proID, productData) => {
      return new Promise(async (resolve, reject) => {
  
        let img = await db.get().collection(collections.PRODUCT).findOne({_id:objectId(proID)})

        if(productData.image  == ''){
           productData.image = img.image
        }else{
          productData.image = productData.image
        }
        await db.get().collection(collections.PRODUCT).updateOne({ _id: objectId(proID) }, {
          $set: {
            productid: productData.productID,
            productname: productData.productName,
            price: productData.price,
            extraPrice: productData.extraPrice,
            category: objectId(productData.category),
            image: productData.image,
            textarea: productData.textarea
  
          }
        }).then((data) => {
          resolve(data)
        })
      })
    },

    deleteProduct: (proID) => {
      return new Promise(async (resolve, reject) => {
        await db.get().collection(collections.PRODUCT).deleteOne({ _id: objectId(proID) }).then((data) => {
          resolve(data)
        })
      })
    },



    //Catagory Section 	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺	😺
    addCategory: (categorydata) => {
        return new Promise(async (resolve, reject) => {
          let cat = await db.get().collection(collections.CATEGORY).findOne({ category: categorydata.category })
          if (cat) {
            response.status = false
            resolve(response)
    
          } else {
            await db.get().collection(collections.CATEGORY).insertOne(categorydata).then((response) => {
              response.status = true
              resolve(response)
    
            })
          }
        })
      },

    viewCategory: () => {
      return new Promise(async (resolve, reject) => {
          await db.get().collection(collections.CATEGORY).find().toArray().then((response) => {
            resolve(response)
          })
      })
    },

    getCategory: () => {
      return new Promise(async (resolve, reject) => {
        let data = await db.get().collection(collections.CATEGORY).find().toArray()
        resolve(data)
      })
  
    },

    findCategory: (catId) => {
      return new Promise(async (resolve, reject) => {
        let find = await db.get().collection(collections.CATEGORY).findOne({ _id: objectId(catId) })
        resolve(find)
      })
    },

    viewEditCategory: (catId) => {
      return new Promise(async (resolve, reject) => {
        await db.get().collection(collections.CATEGORY).findOne({ _id: objectId(catId) }).then((data) => {
          resolve(data)
          console.log(data);
        })
      })
    },

    editCategory: (catId, catData) => {
      return new Promise(async (resolve, reject) => {
        await db.get().collection(collections.CATEGORY).updateOne({ _id: objectId(catId) },
          {
            $set: {
              category: catData.category,
              image:catData.image
            }
          }).then((response) => {
            resolve(response)
          })
      })
    },

    deleteChecked: (catId) => {

      return new Promise(async (resolve, reject) => {
        let check = await db.get().collection(collections.CATEGORY).deleteOne({ _id: objectId(catId) })
        resolve(check)
  
      })
    },

    deleteCat: (catId) => {
      return new Promise(async (resolve, reject) => {
  
        let catCheck = await db.get().collection(collections.PRODUCT).findOne({ category: objectId(catId) })
  
        if (catCheck) {
          console.log(catCheck, "catcheck")
          response.category = true
          resolve(response)
        } else {
  
          response.category = false
          resolve(response)
        }
      })
  
    },


    //Offers 🏷️ 🏷️ 🏷️🏷️ 🏷️ 🏷️🏷️ 🏷️ 🏷️🏷️ 🏷️ 🏷️🏷️ 🏷️ 🏷️🏷️ 🏷️ 🏷️🏷️ 🏷️ 🏷️🏷️ 🏷️ 🏷️🏷️ 🏷️ 🏷️🏷️ 🏷️ 🏷️
    addProdOffer: (offerData) => {

      return new Promise(async (resolve, reject) => {
        db.get().collection(collections.OFFER).insertOne(offerData).then((response) => {
  
          resolve(response)
        })
      })
    },

      // insert objectid in product 
    insertProd: (productname, insertedId, orgAmount, disAmount , percentage) => {
      return new Promise(async (resolve, reject) => {

        db.get().collection(collections.PRODUCT).updateOne({ productname: productname }, {

          $set: {
            offerid: insertedId,
            ogAmount: orgAmount,
            price: disAmount,
            offper: percentage

          }
        }).then((response) => {
          resolve(response)
        })
      })
    },

     // get product for offer 
    calProd: (data) => {
      return new Promise(async (resolve, reject) => {
        await db.get().collection(collections.PRODUCT).findOne({ _id: objectId(data) }).then((prodata) => {
          console.log(prodata + "Inside DB")
          resolve(prodata)
        })
      })
    },

    categoryOffer: (data) => {
      return new Promise(async (resolve, reject) => {
        await db.get().collection(collections.CATEGORYOFFER).insertOne(data).then((response) => {
          resolve(response)
        })
      })
    },

    catProd: (details,insertedId) => {

      return new Promise(async (resolve, reject) => {
  
        await db.get().collection(collections.PRODUCT).find({ category: objectId(details.category) }).toArray().then(async (response) => {
    
          for (i = 0; i < response.length; i++) {
  
            let ogAmount = parseInt(response[i].ogAmount)
            let offerAmount = (1 - details.categoryofferper / 100) * parseInt(response[i].ogAmount)
  
            offerAmount = offerAmount.toString();
  
            console.log(offerAmount, "offerAmount")
  
            await db.get().collection(collections.PRODUCT).updateOne({ _id: response[i]._id }, {

              $set: {
                price: offerAmount,
                ogAmount: ogAmount,
                offper: details.categoryofferper,
                catOfferid : insertedId
              }
            },
              {
                $upsert: true
              }
            )
          }
          resolve(response)
        })
      })
    },


    //Coupon 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️
    addCoupon: (data) => {
      return new Promise(async (resolve, reject) => {
        await db.get().collection(collections.COUPON).insertOne(data).then((response) => {
          resolve(response)
        })
      })
    },

    viewCoupon: () => {
      return new Promise(async (resolve, reject) => {
        await db.get().collection(collections.COUPON).find().toArray().then((data) => {
          resolve(data)
        })
      })
    },

    // delete coupon 

    deleteCoupon : (couponID)=>{
     return new Promise(async(resolve,reject)=>{
      await db.get().collection(collections.COUPON).deleteOne({_id:objectId(couponID)}).then((response)=>{
        resolve(response)
      })
     })
    },

}