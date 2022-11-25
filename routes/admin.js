var express = require('express');
var router = express.Router();
var upload = require('../multer/multers')
var helpers = require('../helpers/admin-helper')
var collections = require('../config/collections')


/* GET home page. */
// Admin Dashbord 👤
router.get('/', function(req, res) {
  res.render("admin/admin-pannel", {admin: true});
});



//🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋
// Product Section 🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒
router.get('/add-product', function(req, res) {
  helpers.getCategory().then((data) => {
    res.render("admin/add-product", {admin: true, data});
  })
});

//Product add 🛒++
router.post('/add-product', upload.array('img', 4), async (req, res)=>{
  
  var filename = req.files.map(function (file) {
    return file.filename;
  })

  req.body.image = filename

  await helpers.addProduct(req.body).then((data) => {
    res.render("admin/admin-pannel", {admin: true});
  })
})

//View all product 🛒🛒🛒🛒🛒🛒🛒
router.get('/view-product', function(req, res) {
  helpers.viewProducts().then((data) => {
    res.render('admin/view-product', { admin: true, data })
  })
});

//Product edit 🛒+-
router.get('/edit-product/:id', (req, res)=>{
  let proid = req.params.id;
  
  helpers.getUpdateProduct(proid).then((product) => {
    helpers.getCategory().then((data) => {
      helpers.findCategory(product.category).then((findOne)=>{
        res.render("admin/edit-product", { admin: true, product, data, findOne});
      })
     
    })
  })
  
})

router.post('/edit-product/:id', upload.array('image', 4), (req, res)=>{

  var filename = req.files.map(function (file) {
    return file.filename;
  }) 
  req.body.image = filename

  helpers.updateProduct(req.params.id, req.body).then((data) => {
    console.log("hello")
    res.redirect('/admin/view-product')

  })
})

//Product delet 🛒--
router.get('/delete-product/:id', (req, res)=>{
  let proID = req.params.id;
  console.log(proID);
  helpers.deleteProduct(proID).then((data) => {
    res.redirect('/admin/view-product')
  })
})




//Catagory 🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋

router.get('/add-catagory', (req, res)=> {
  res.render('admin/add-catagory', {admin: true})
})

router.post('/add-catagory', upload.single('img'), (req, res)=> {
  req.body.image = req.file.filename
  console.log(req.file.filename);

  helpers.addCategory(req.body).then((response) => {
    console.log(response);
    if(response.status){

      res.redirect('add-catagory')
    }else{
      // req.session.catmsg= "Category Already Exist"
      res.redirect('add-catagory')
    }
  })
})

router.get('/view-category', (req, res) => {
  helpers.viewCategory().then((data) => {
    res.render('admin/view-category', { admin: true, data })
    console.log(data);
  })
  
})

router.get('/edit-catagory/:id', (req, res)=>{
  let catId = req.params.id
  helpers.viewEditCategory(catId).then((data) => {
    res.render('admin/edit-category', { admin: true, data})
  })
})

router.post('/edit-category/:id',upload.single("img"), (req, res)=>{
  console.log(req.body + "whai is it");

  // let catId = req.params.id
  // helpers.editCategory(catId, req.body).then((response)=>{
    res.redirect('/admin/view-category')
  // })
})


router.get('/delete-catagory/:id', (req, res)=>{
  let catId =req.params.id

  helpers.deleteCat(catId).then((response)=>{
    if(response.category){

      res.json(response)
    }else {
      let check = helpers.deleteChecked(catId)
      res.json(response)
    }
  })
})

//Offers 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️ 🏷️

router.get('/add-offer', (req, res)=>{
  helpers.viewProducts().then((data) => {
    res.render('admin/add-offer', {admin: true, data: data})
    console.log(data);
  })
})

router.post('/add-offer', async (req, res)=> {
  let offerName = req.body.offerName
  let percentage = parseInt(req.body.OfferPercentage)
  let product = req.body.productID
  console.log(product + " Router")

  let productData = await  helpers.calProd(product)
  console.log(productData.price)
  let orgAmount = parseInt(productData.ogAmount)

  let disAmount = (1-percentage/100)*orgAmount

  let response =await  helpers.addProdOffer(req.body)
  console.log(response.insertedId)
  let insertedId = response.insertedId

  await helpers.insertProd(offerName,insertedId,orgAmount,disAmount,percentage).then((response)=>{
   res.redirect('/admin/add-offer')
  })   
})

router.get('/view-offer', (req, res)=> {
  
})


router.get('/add-categoryoffer', (req, res) => {
  helpers.viewCategory().then((data) => {
    console.log(data);
    res.render('admin/add-categoryoffer', {admin: true, data})
  })
})


router.post('/add-categoryoffer', async(req, res)=>{       
  console.log(req.body,"category details")  
  let catOff = await helpers.categoryOffer(req.body)
  console.log(catOff.insertedId)
  let prodData = await helpers.catProd(req.body,catOff.insertedId)
  console.log(prodData,"proddata")
  console.log(catOff,"catoff")
  res.redirect('/admin/add-categoryoffer')
})

router.get('/view-categoryoffer', function(req, res) {

})


//Coupens 🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 

router.get('/add-coupon', function(req, res) {
  res.render('admin/add-coupon', {admin: true})
})

router.post('/add-coupon', async(req, res)=>{
  let coupon = req.body
  console.log(coupon)
  await helpers.addCoupon(coupon)
  res.redirect('/admin/add-coupon')
})

router.get('/view-coupon', async function(req, res) {
  let data = await helpers.viewCoupon()
  res.render('admin/view-coupon', {admin: true, data})
})

router.get('/delete-coupon/:id',async(req,res)=>{
  await helpers.deleteCoupon(req.params.id).then((resposne)=>{
    res.json(resposne)
  })
})

module.exports = router;
