var express = require('express');
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-management");
const cartHelpers = require("../helpers/cart-helpers");
const itemHelpers = require("../helpers/product-management");
const store = require("../multer/multer");

let userName = "admin";
let pin = "12345";

const verifyLogin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.render("admin/admin-login", {
      adminLogin: true,
      errout: req.session.err,
    });
    req.session.err = false;
  }
};

router.post("/view-dashboard", (req, res) => {
  const { Email, Password } = req.body;
  if (userName === Email && pin === Password) {
    req.session.check = true;
    req.session.admin = {
      userName,
    };
    res.redirect("/admin/admin-dashboard");
  } else {
    req.session.err = "incorrect username or password";
    res.redirect("/admin");
  }
});

router.get("/logout", (req, res) => {
  req.session.admin = null;
  res.redirect("/admin");
});

// get user listing
router.get("/", (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin/admin-dashboard");
  } else {
    res.render("admin/admin-login", {
      adminLogin: true,
      errout: req.session.err,
    });
    req.session.err = false;
  }
});

let currentYear= 2022
router.get("/admin-dashboard", verifyLogin, async (req, res) => {
  let userCount = await itemHelpers.getUserCount();
  let productCount = await itemHelpers.getProductCount();
  let ordersCount = await itemHelpers.getOrdersCount();
  let totalRevenue = await itemHelpers.getTotalRevenue();
  let cod = await itemHelpers.getPaymentMethodNums('COD')
  let razorpay = await itemHelpers.getPaymentMethodNums('razorpay')
  let paypal = await itemHelpers.getPaymentMethodNums('paypal')
  let wallet = await itemHelpers.getPaymentMethodNums('wallet')
  let chartData= await itemHelpers.getChartData(currentYear)
  let listedYears= await itemHelpers.getYear()
  // let monthlySalesReport= await itemHelpers.getMonthlySalesReport(currentYear)
  res.render("admin/admin-pannel", {
    admin: true,
    userCount,
    productCount,
    ordersCount,
    totalRevenue,
    chartData,
    currentYear,
    listedYears,
    cod,
    razorpay,
    paypal,
    wallet
  });
});

router.post('/change-year',(req,res)=>{
  let response={}
  try{
    yearValue=req.body.year
    currentYear= yearValue
  response.status=true
  res.json(response)
  }catch(error){
    console.log(error); 
  }
})

router.get('/sales-yearly',async(req,res)=>{
  try{
    let yearlySalesReport= await itemHelpers.getYearlySalesReport()
  res.render('admin/sales-yearly',{admin: true,yearlySalesReport,currentYear})
  }catch(error){
    console.log(error); 
  }
})

router.get('/sales-monthly',async(req,res)=>{
  try{
    let monthlySalesReport= await itemHelpers.getMonthlySalesReport(currentYear )
  let listedYears= await itemHelpers.getYear()
  res.render('admin/sales-monthly',{admin: true,monthlySalesReport,listedYears,currentYear})
  }catch(error){
    console.log(error); 
  }
})

router.get('/sales-weekly',async(req,res)=>{
  try{
    let weeklySalesReport= await itemHelpers.getWeeklySalesReport(currentYear)
  let listedYears= await itemHelpers.getYear()
  res.render('admin/sales-weekly',{admin: true,weeklySalesReport,listedYears,currentYear})
  }catch(error){
    console.log(error); 
  }
})

//users
router.get("/view-users", verifyLogin, (req, res) => {
  productHelpers.getAlluser().then((users) => {
    res.render("admin/view-users", { admin: true, users });
  });
});

router.get("/Block-user/:id", verifyLogin, (req, res) => {
  let userId = req.params.id;
  userHelpers
    .blockUser(userId)
    .then((response) => {
      res.redirect("/admin/view-users");
    })
    .catch(() => {
      res.render("admin/404", { admin: true });
    });
});

router.get("/Un-Block-user/:id", verifyLogin, (req, res) => {
  let userId = req.params.id;
  userHelpers.unblockUser(userId).then((response) => {
    req.session.user = null;
    req.session.loggedIn = null;
    res.redirect("/admin/view-users");
  });
});

//products
// view-products
router.get("/view-products", verifyLogin, (req, res) => {
  itemHelpers.getAllProducts().then((products) => {
    res.render("admin/view-products", { admin: true, products });
  });
});

router.get("/add-products", verifyLogin, (req, res) => {
  itemHelpers.getCategories().then((categories) => {
    res.render("admin/add-products", { admin: true, categories });
  });
});

//product delete
router.get("/product-delete/:id", verifyLogin, (req, res) => {
  let proId = req.params.id;
  itemHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/view-products");
  });
});


//edit-product
router.get("/edit-product/:id", verifyLogin, async (req, res) => {
  try {
    let editProductFormData = await itemHelpers.getProductData(req.params.id);
    let categories = await itemHelpers.getCategories();
    res.render("admin/edit-product", {
      editProductFormData,
      categories,
      admin: true,
    });
  } catch {
    res.render("admin/404");
  }
});

//edit-productdata post
router.post(
  "/product-edit/:id",
  store.array("image", 4),
  verifyLogin,
  async (req, res) => {
    const files = req.files;
    var filenames = req.files.map(function (file) {
      return file.filename;
    });
    req.body.Image = filenames;
    itemHelpers.updateProduct(req.params.id, req.body).then((response) => {
      res.redirect("/admin/view-products");
    });
  }
);

router.post("/add-item", store.array("image", 4), verifyLogin, (req, res) => {
  const files = req.files;
  // if (!files) {
  //   const err = new Error("please choose the images");
  //   res.redirect("/add-products", err);
  // }
 

  var filenames = req.files.map(function (file) {
    return file.filename;
  });

  req.body.Image = filenames;
  itemHelpers.addItem(req.body).then(() => {
    res.redirect("/admin/view-products");
  });
});

//categories
//getting catogories page for delete update
router.get("/categories", verifyLogin, (req, res) => {
  itemHelpers.getCategories().then((categories) => {
    res.render("admin/categories", { admin: true, categories });
  });
});

router.get("/show-banner", verifyLogin, (req, res) => {
  itemHelpers.getAllBanner().then((banner) => {
    res.render("admin/banner", { admin: true, banner });
  });
});

router.get("/add-banner", verifyLogin, (req, res) => {
  res.render("admin/add-banner", { admin: true });
});

router.post("/add-banner", store.array("Images"), (req, res) => {
  var filenames = req.files.map(function (file) {
    return file.filename;
  });
  req.body.Images = filenames;
  itemHelpers.addBanner(req.body).then(() => {
    res.redirect("/admin/show-banner");
  });
});

router.get("/edit-banner/:id", verifyLogin, async (req, res) => {
  let banner = await itemHelpers.getOneBanner(req.params.id);
  res.render("admin/edit-banner", { admin: true, banner });
});

router.post("/edit-banner/:id", store.array('Images'), verifyLogin, async (req, res) => {
  var filenames = req.files.map(function (file) {
    return file.filename;
  });
  req.body.Images = filenames;
  itemHelpers.updateBanner(req.params.id, req.body).then(() => {
    res.redirect("/admin/show-banner");
  });
});

router.get("/delete-banner/:id", verifyLogin, (req, res) => {
  let banner = req.params.id;
  itemHelpers.deleteBanner(banner).then(() => {
    res.redirect("/admin/show-banner");
  });
});

router.get("/add-categories", verifyLogin, (req, res) => {
  res.render("admin/add-category", { admin: true });
});

router.post("/add-category", verifyLogin, (req, res) => {
  itemHelpers.addCategory(req.body);
  res.redirect("/admin/categories");
});

router.get("/edit-categories/:id", verifyLogin, (req, res) => {
  itemHelpers
    .getSingleCategory(req.params.id)
    .then((category) => {
      res.render("admin/edit-category", { admin: true, category });
    })
    .catch(() => {
      res.render("admin/404");
    });
});

router.post("/edit-category/:id", (req, res) => {
  itemHelpers.updateCategory(req.params.id, req.body);
  res.redirect("/admin/categories");
});

router.get("/delete-category/:id", verifyLogin, (req, res) => {
  itemHelpers.deleteCategory(req.params.id).then((response) => {
    res.redirect("/admin/categories");
  });
});

router.get("/category-offer", verifyLogin, async (req, res) => {
  let category = await itemHelpers.getCategories();
  res.render("admin/category-offer", { admin: true, category });
});

router.get("/add-offer-category/:id", verifyLogin, (req, res) => {
  req.session.catId = req.params.id;
  res.render("admin/add-offer-category", { admin: true });
});

router.post("/add-offer-category", verifyLogin, (req, res) => {
  itemHelpers.addOfferCategory(req.body, req.session.catId).then(() => {
    res.redirect("/admin/category-offer");
  });
});

router.post("/offer-activate", (req, res) => {
  newoffer = req.body.offer;
  itemHelpers
    .changeOfferStatus(req.body.categoryId, newoffer)
    .then((response) => {
      itemHelpers.activateCategoryOffer(req.body.categoryId);
      res.json(response);
    });
});

router.post("/offer-deactivate", (req, res) => {
  newoffer = req.body.offer;
  itemHelpers
    .changeOfferStatus(req.body.categoryId, newoffer)
    .then((response) => {
      itemHelpers.deactivateCategoryOffer(req.body.categoryId);
      res.json(response);
    });
});

//orders
router.get("/admin-orders", verifyLogin, (req, res) => {
  itemHelpers.getOrders().then((Items) => {
    res.render("admin/admin-orders", { admin: true, Items });
  });
});

router.post("/change-order-status/:id", verifyLogin, (req, res) => {
  itemHelpers
    .changeOrderStatus(req.params.id, req.body.status)
    .then((response) => {
      res.json(response);
    });
});

router.get("/view-order/:id", verifyLogin, async (req, res) => {
  let orders = await userHelpers.getOrderDetails(req.params.id);
  userHelpers.getOrderedProducts(req.params.id).then((products) => {
    res.render("admin/order-details", { admin: true, orders, products });
  });
});

//coupons section
router.get("/show-coupon", verifyLogin, (req, res) => {
  itemHelpers.getAllCoupon().then((coupon) => {
    res.render("admin/show-coupon", { admin: true, coupon });
  });
});

router.get("/add-coupon", verifyLogin, (req, res) => {
  res.render("admin/add-coupon", { admin: true });
});

router.post("/add-coupon", (req, res) => {
  itemHelpers.addCoupon(req.body).then(() => {
    res.redirect("/admin/show-coupon");
  });
});

router.get("/delete-coupon/:id", verifyLogin, (req, res) => {
  let couponId = req.params.id;
  itemHelpers.deleteCoupon(couponId).then(() => {
    res.redirect("/admin/show-coupon");
  });
});

module.exports = router;
