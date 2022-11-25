var express = require('express');
var router = express.Router();
var helpers = require('../helpers/user-helper')
const { Db } = require('mongodb');
var ObjectID = require('mongodb').ObjectId

let cartCount = 0;
let user; 
let wallet; 

//MiddlewareStack 
let userAuth = (req, res, next) => {
  if (req.session.user) {
    wallet = req.session.user

    // req.session.user.cartCount =  helpers.getCartCount(req.session.user._id)
    // let cartCount =req.session.user.cartCount  

    next()

  } else {

    res.redirect('/user_signin')
  }
}


/* GET users listing. */
router.get('/', async function(req, res) {
  let user = req.session.user
  console.log(typeof (user))
  let bannerImg = await helpers.viewBanner()

  let category = await helpers.getCategoryProduct()

  let hotProd = await helpers.hotProd()
  // let cartCount=0
  if (req.session.user) {

    req.session.user.cartCount = await helpers.getCartCount(req.session.user._id)
    cartCount = req.session.user.cartCount
  } else {
    cartCount = 0
  }
  res.render('user/user-dashbord',  { user, cartCount, category,  userlogin: true, hotProd, navs: "home"} )
});
  

//Signup create a new user 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 🔐 
router.get('/signup', function(req, res){
  res.render('user/user-signup');
  console.log(req);
});

router.post('/signup', function(req, res){
  // console.log(req.body);
  helpers.dosignup(req.body).then((response) => {
    if (response.status) {
      console.log(req.session);
      req.session.signErr = true;
      res.redirect('/signup')
      console.log("sinerr" + "Identifie session");
    } else if (response.referral) {
      console.log(req.session + "Identifie session");
      req.session.sigErr = true;
      res.redirect('/signup')
    }
    else {
      res.redirect('/signup')
      console.log(req + "Identifie session");
    }
  })
});



//Logins 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 🔓 
router.get('/login', function(req, res){
  res.render('user/user-login');
})

router.post('/login', (req, res)=>{
  helpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.LoggedIn = true;
      req.session.user = response.user
      console.log(req.session.user );
      res.redirect('/')
    } else {
      // console.log(req.session);
      req.session.loginErr = true;
      res.redirect('/user-signin')
    }
  })
});

router.get('/logout', function(req, res){
  req.session.user = null
  req.session.LoggedIn = null
  res.redirect('/')
});

//View all Produt  🏪 🏪 🏪 🏪 🏪 🏪 🏪 🏪 🏪 🏪 🏪 🏪 🏪 🏪 🏪 🏪 🏪
router.get('/store',async function(req, res){
  let user = req.session.user

  let category = await helpers.getCategoryProduct()

  let count = await  helpers.viewProdCount()   
   
  let pageNum = parseInt(count) /6
    
  let p=[]
  for(i=0;i<pageNum;i++){
   p[i]=i+1      
  }   
  helpers.getLimitProd(1,6).then((data) => { 
    let num = Math.floor(Math.random() * 500) + 100
    data.extraPrice = num + data.price
    console.log(data)
    res.render('user/user-store', { data, user, category, cartCount,p, userlogin: true,  });
  })

});

//View singleProducts
router.get('/singleProducts/:id', async function(req, res){ 
  let proID = req.params.id;
  console.log(proID + "   proID");
  // res.render('user/user-cart' );
  // res.render('user/user-singleproduct')
  let user = req.session.user
  helpers.viewSingleProd(proID).then(async (data) => {
    console.log(data.category._id)
    let relatedProd = await helpers.relatedProd(data.category._id)
    res.render('user/user-singleproduct', { data, user, cartCount, relatedProd, userlogin: true } );
  });
});

// add to Cart 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 🛒 
router.get('/add-to-cart/:id', function(req, res){
  helpers.addToCart(req.params.id, req.session.user._id).then((response) => {
    res.json(response);
  })
});

//View Cart 🛒 🛒 👀 👀 👀
router.get('/view-cart', async(req, res) => {
  let user = req.session.user
  cartCount = await helpers.getCartCount(req.session.user._id)
  let products = await helpers.getCartProduct(req.session.user._id)
  let totalAmount = await helpers.getAmountTotal(req.session.user._id)
  let subtotal = await helpers.getAmountArray(req.session.user._id)
  for (var i = 0; i < products.length; i++) {
    products[i].subTotal = subtotal[i].total
  }

  res.render('user/user-cart', { products, user, totalAmount, cartCount, userlogin: true })
})

router.post('/changeProductQuantity', (req, res)=>{
  helpers.changeProdCount(req.body).then(async (response) => {
    console.log(req.body, "body")
    response.total = await helpers.getAmountTotal(req.body.user)
    // response.totalSingle = await helperss.getAmount(req.body)
    response.subtotal = await helpers.getAmount(req.body)
    res.json(response)

  })
})



router.post('/delete-cart-product', async (req, res) => {
  cartCount = await helpers.getCartCount(req.session.user._id)
  await helpers.deleteCartProduct(req.body, req.session.user._id)
  res.json({ status: true })

})

//Apply Coupens🎫 ️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫️🎫️ 🎫
router.post('/apply-coupon', async (req, res)=>{
  let userLog = req.session.user;
  req.session.couponData = req.body.coupon;
  console.log(req.body)
  let amount = {};
  helpers.couponCheck(userLog._id, req.body).then((response) => {
    if (response.coupon) {
      amount = response;
      req.session.couponedAmount = amount;
      amount.status = true;
      res.json(amount);
    } else if (response.usedcoupon) {
      console.log("coupon already used");
      amount.used = true;
      res.json(amount);
    } else if (response.small) {
      console.log("Not within Cap limits");
      amount.small = true;
      res.json(amount);
    } else if (response.expired) {
      console.log("Coupon expired");
      amount.expired = true;
      res.json(amount);
    } else {
      console.log("coupon invalid");
      amount.status = false;
      res.json(amount);
    }
  });

})

// remove coupon 
router.post('/remove-coupon', async (req, res) => {
  let user = req.session.user._id
  await helpers.removeCoupon(req.session.user._id).then(async (response) => {
    response.totalAmount = await helpers.getAmountTotal(user)

    res.json(response)
  })
})

//Place order 🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒
router.get('/place-order', async (req, res) => {

  let cartCheck = await helpers.cartCheck(req.session.user._id)

  if (cartCheck) {
    res.redirect('/view_products')
  } else {
    // let address = await helpers.addAddress(req.body, req.session.user._id)
    console.log(req.session.user._id)
    let address = await helpers.viewAddress(req.session.user._id)
    let totalAmount = await helpers.getAmountTotal(req.session.user._id)
    let userData = await helpers.userProfile(req.session.user._id)
    let products = await helpers.getCartProduct(req.session.user._id)
    let subtotal = await helpers.getAmountArray(req.session.user._id)
    let userId = req.session.user._id
    let user = req.session.user

    for (var i = 0; i < products.length; i++) {
      products[i].subTotal = subtotal[i].total
    }

    // req.session.user.cartCount =  helpers.getCartCount(req.session.user._id)
    // let cartCount =req.session.user.cartCount
    // let cartCount=req.session.user.cartCount
    res.render('user/user-checkout', { totalAmount, user, userId, cartCount, userData, userlogin: true, address, products})

  }
})


//Place order post 🛒🛒 🛒🛒 🛒🛒 🛒🛒 🛒🛒 🛒🛒 🛒🛒 🛒🛒 🛒🛒 🛒🛒 🛒🛒 
router.post('/place-order', async(req, res) => {
  let userLog = req.session.user;
  let deliveryAddress = req.body.checkoutAddress;
  let products = await helpers.getCartProdList(req.session.user._id)
  let totalPrice = await helpers.getAmountTotal(req.session.user._id)
  let { wallet : userWallet } = await helpers.getUserWallet(req.session.user._id)
  let discount;

  console.log("hear is the payment amount")
  console.log(req.body.paymentMethod);

  helpers
    .placeOrder(
      products,
      deliveryAddress,
      totalPrice,
      req.body.paymentMethod,
      userLog._id,
      discount
    )
    .then((response) => {
      req.session.orderId = response.insertedId.toString();
      if (req.body.paymentMethod == "COD") {
        res.json({ cod: true });
        helpers.clearCart(userLog._id);
      } else if (req.body.paymentMethod == "razorpay") {
        console.log("inside razorpay");
        helpers
        .generateRazorPay(req.session.orderId, totalPrice)
        .then((order) => {
          order.razorpay = true;
          res.json(order);
        });
      } else if (req.body.paymentMethod == "paypal") {
        helpers.priceConvert(totalPrice).then((convertedPrice) => {
          req.session.totalPrice = convertedPrice;
          helpers
          .generatePayPal(req.session.orderId, convertedPrice)
          .then((data) => {
            res.json(data);
          });
        });
      } else if (req.body.paymentMethod == "wallet") {
        if (walletBalance < totalPrice) {
          res.json({ walletLow: true });
        } else {
          walletBalance = walletBalance - totalPrice;
          helpers.updateWallet(
            userLog._id,
            walletBalance,
            req.session.orderId,
            totalPrice
          );
          helpers.clearCart(userLog._id);
          helpers.changePaymentStatus(req.session.orderId).then(() => {
            res.json({ walletSuccess: true });
          });
        }
      }
    });
})

router.post("/verify-payment",  (req, res) => {
  console.log("verify-payment")
  console.log(req.body["order[receipt]"]);
  helpers.verifyPayment(req.body).then(() => {
    helpers
      .changePaymentStatus(req.body["order[receipt]"])
      .then(() => {
        res.json({ razor: true });
        helpers.clearCart(req.session.user._id);
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: false });
      });
  });
});

// add address 
router.post("/add-address", async (req, res) => {
  await helpers.addAddress(req.body, req.session.user._id)
  res.redirect('/place-order')

})

router.get('/user-profile', (req, res)=>{
  res.render('user/user-profile' )
})

router.post('/place-name' , (req, res) => {
  console.log(req.body);
  res.json({status: true});
})

router.get('/blog', (req, res) =>{
  res.render('user/user-blog' );
})

router.get('/contact', (req, res) =>{
  
  res.render('user/user-contact' ); 
});


module.exports = router;
