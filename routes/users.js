var express = require('express');
var router = express.Router();

const userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-management");
const cartHelpers = require("../helpers/cart-helpers");
const itemHelpers = require("../helpers/product-management");

const client = require("twilio")(
  process.env.ACCOUNT_SID,
  process.env.AUTH_TOKEN,
  {
    lazyLoading: true,
  }
);

let User_number = "";
let trueOtpUser = {};
let editDetails;

const verifyLogin = async (req, res, next) => {
  if (req.session.loggedIn) {
    req.session.cartCount = await cartHelpers.getCartCount(
      req.session.user._id
    );
    next();
  } else {
    req.session.notLogged = "Please Login First";
    req.session.user = null;
    req.session.loggedIn = null;
    res.redirect("/login");
  }
};

const verifyCartCount = (req, res, next) => {
  if (req.session.cartCount) next();
  else res.redirect("/shop");
};

router.get("/login", (req, res) => {
  let blocked = req.session.blockedUser;
  let notLogged = req.session.notLogged;
  if (req.session.loggedIn) {
    res.redirect("/user-profile");
  } else {
    res.render("user/login", {
      userHead: true,
      loginErr: req.session.loginErr,
      blocked,
      notLogged,
    });
    req.session.loginErr = false;
    req.session.blockedUser = false;
    req.session.notLogged = false;
  }
});

router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.userBlock) {
      req.session.blockedUser = true;
      res.redirect("/login");
    } else if (response.status) {
      req.session.user = response.user;
      req.session.loggedIn = true;
      res.redirect("/shop");
    } else {
      req.session.loginErr = true;
      res.redirect("/shop");
    }
  });
});

router.get("/signup", (req, res) => {
  res.render("user/signup", { signErr: req.session.signErr, userHead: true,});
  req.session.signErr = false;
});

router.post("/signup", (req, res) => {
  let reqBody = req.body;
  let Phone = parseInt(req.body.Phone);
  let walletAction = "Referral credit";
  reqBody.block = "";
  reqBody.userReferralCode = Phone.toString(16);
  userHelpers.doSignUp(req.body).then((response) => {
    if (response.status) {
      req.session.signErr = true;
      res.redirect("/signup");
    } else {
      userHelpers.referralCheck(req.body.referralCode);
      userHelpers.updateWalletCreditReferral(
        req.body.referralCode,
        walletAction
      );
      res.redirect("/login");
    }
  });
});

//otp section
router.get("/otp-login", (req, res) => {
  res.render("user/otp-login");
  req.session.loginErr = false;
});

router.post("/otp-verification", (req, res) => {
  userHelpers.numberExist(req.body.number).then((response) => {
    if (response.userExist == false) {
      res.render("user/otp-login", { userNotExist: true });
    } else if (response.userBlock == true) {
      res.render("user/otp-login", { userBlock: true });
    } else {
      trueOtpUser = response;
      const { number } = req.body;
      console.log(number);
      User_number = number;
      client.verify.services(process.env.SERVICE_SID).verifications.create({
        to: `+91${number}`,
        channel: "sms",
      });
      res.render("user/otp-verify", { user: response.user });
    }
  });
});

router.post("/otp-matching", function (req, res) {
  const { otp } = req.body;

  client.verify
    .services(process.env.SERVICE_SID)
    .verificationChecks.create({
      to: `+91${User_number}`,
      channel: "sms",
      code: otp,
    })
    .then((resp) => {
      if (resp.valid == false) {
        req.session.otp = true;
        let otpvalidation = req.session.otp;
        res.render("user/otp-verify", { otpvalidation });
      } else if (resp.valid == true) {
        req.session.user = trueOtpUser;
        req.session.loggedIn = true;
        res.redirect("/");
      }
    });
});

router.get("/user-profile", verifyLogin, async (req, res) => {
  let userLog = req.session.user;
  let cartCount = req.session.cartCount;
  let walletDetails = await userHelpers.getWallet(userLog._id);
  let userAddress = await userHelpers.getUserAddress(userLog._id);
  res.render("user/userProfile", {
    userHead: true,
    userLog,
    cartCount,
    walletDetails,
    userAddress,
    change: editDetails,
    passwordSuccess: passwordSuccess,
    resetEr: resetEr,
    passwordMatchEr: passwordMatchEr,
  });
  editDetails = false;
  passwordSuccess = false;
  resetEr = false;
  passwordMatchEr = false;
});

//edit profile
router.post("/editprofile", verifyLogin, (req, res) => {
  let userLog = req.session.user;
  userHelpers.editProfile(userLog._id, req.body).then((editedUser) => {
    req.session.user = editedUser;
    editDetails = true;
    res.redirect("/user-profile");
  });
});

//password reset
var resetEr;
var passwordMatchEr;
var passwordSuccess;
router.post("/resetpassword", (req, res) => {
  let userLog = req.session.user;
  if (req.body.Newpassword === req.body.Confirmpassword) {
    console.log("true");
    userHelpers
      .resetPassword(userLog._id, req.body)
      .then(() => {
        res.redirect("/user-profile");
        passwordSuccess = true;
      })
      .catch((err) => {
        res.redirect("/user-profile");
        resetEr = true;
      });
  } else {
    res.redirect("/user-profile");
    console.log("false");
    passwordMatchEr = true;
  }
});

//userAddAddress
router.post("/addaddress", verifyLogin, (req, res) => {
  let userLog = req.session.user;
  userHelpers.addAddressUser(req.body, userLog._id).then(() => {
    res.redirect("/user-profile");
  });
});

router.get("/logout", (req, res) => {
  req.session.loggedIn = null;
  req.session.user = null;
  res.redirect("/");
});

/* GET users listing. */
router.get("/", async function (req, res, next) {
  let userLog = req.session?.user;
  let cartCount = req.session.loggedIn
    ? await cartHelpers.getCartCount(userLog._id)
    : null;
  let banner = await itemHelpers.getAllBanner();
  let categories = await productHelpers.getCategories();
  let products = await productHelpers.getAllProducts();

  if (userLog) {
    let wishProducts = await productHelpers.wishListProducts(userLog?._id);
    if (wishProducts) {
      for (let i = 0; i < products.length; i++) {
        for (let j = 0; j < wishProducts.length; j++) {
          if (products[i]._id + "" == wishProducts[j].item + "") {
            console.log(products[i]._id + "", wishProducts[j].item + "", i);
            products[i].wishlist = true;
          }
        }
      }
    }
  }
 
  res.render("user/user-dashbord", {
    userHead: true,
    userLog,
    products,
    cartCount,
    banner,
    categories,
  });
});

//all products page
router.get("/shop", async (req, res) => {
  let userLog = req.session?.user;
  let cartCount = req.session.loggedIn
    ? await cartHelpers.getCartCount(userLog._id)
    : null;
  let categories = await productHelpers.getCategories();
  let products = await productHelpers.getAllProducts()
  
  if (userLog) {
    let wishProducts = await productHelpers.wishListProducts(userLog?._id);
    if (wishProducts) {
      for (let i = 0; i < products.length; i++) {
        for (let j = 0; j < wishProducts.length; j++) {
          if (products[i]._id + "" == wishProducts[j].item + "") {
            products[i].wishlist = true;
          }
        }
      }
    }
  }
  
    res.render("user/store", {
      userHead: true,
      products,
      cartCount,
      userLog,
      categories,
    });
  
});

//view products according to category
router.get("/show-products/:id", async (req, res) => {
  let userLog = req.session?.user;
  let cartCount = req.session.loggedIn
    ? await cartHelpers.getCartCount(userLog._id)
    : null;
  let categories = await productHelpers.getCategories();
  productHelpers.categoryFilter(req.params.id).then((products) => {
    res.render("user/shop", {
      userHead: true,
      products,
      userLog,
      cartCount,
      categories,
    });
  });
});

//view products in users home page
router.get("/view-product/:id", async function (req, res) {
  let userLog = req.session?.user;
  let cartCount = req.session.loggedIn
    ? await cartHelpers.getCartCount(userLog._id)
    : null;
  productHelpers
    .getProductData(req.params.id)
    .then((product) => {
      res.render("user/product-details", {
        product,
        userLog,
        cartCount,
        userHead: true,
      });
    })
    .catch(() => {
      res.render("user/404", { userHead: true });
    });
});

router.get("/user-orders-list", verifyLogin, async (req, res) => {
  let userLog = req.session.user;
  let cartCount =  req.session.cartCount;
  let orders = await userHelpers.getUserOrders(userLog._id);
  res.render("user/user-orders", {
    userLog,
    cartCount,
    orders,
    userHead: true,
  });
});

router.get("/view-order-details/:id", verifyLogin, async (req, res) => {
  let userLog = req.session.user;
  let cartCount = req.session.cartCount;
  let orders = await userHelpers.getOrderDetails(req.params.id);
  userHelpers
    .getOrderedProducts(req.params.id)
    .then((products) => {
      res.render("user/ordered-products", {
        userHead: true,
        products,
        userLog,
        cartCount,
        orders,
      });
    })
    .catch(() => {
      res.render("user/404", { userHead: true });
    });
});

router.post("/invoice", async (req, res) => {
  let userLog = req.session.user;
  let orderId = req.body.orderId;
  let response = {};
  try {
    let products = await userHelpers.getOrderedProducts(orderId);
    let orders = await userHelpers.getOrderDetails(orderId);
    let invoice = await userHelpers.generateInvoice(products, orders, userLog);
    response.invoice = invoice;
    res.json(response);
  } catch (error) {
    console.log(error);
  }
});

router.post("/user-cancel-order", verifyLogin, async (req, res) => {
  let userLog = req.session.user;
  userHelpers
    .cancelOrderStatus(req.body.order, req.body.status)
    .then((response) => {
      res.json(response);
    });
  if (req.body.paymentMethod != "COD") {
    await userHelpers.cancelAmountWallet(userLog._id, req.body.total);
    await userHelpers.updateWalletCredit(
      userLog._id,
      req.body.orderId,
      req.body.total,
      "Product Cancelled"
    );
  }
});

router.post("/return-order", (req, res) => {
  userHelpers
    .returnOrderStatus(req.body.order, req.body.status)
    .then((response) => {
      res.json(response);
    })
    .catch(() => {
      res.render("user/404", { userHead: true });
    });
});

//cart section
router.get("/cart", verifyLogin, async (req, res) => {
  let userLog = req.session.user;
  let cartCount = req.session.cartCount;
  let products = await cartHelpers.getCartProducts(userLog._id);
  products=products.map((prod)=>{
    prod.product.subtotal= parseInt(prod.product.price) * parseInt(prod.quantity)
    return prod 
  })
  let total = await cartHelpers.getTotalAmount(userLog._id);
  res.render("user/cart", {
    userHead: true,
    products,
    cartCount,
    total,
    userLog,
  });
});

router.get('/wishlist', verifyLogin, async(req, res)=>{
    let userLog = req.session.user;
    let cartCount = req.session.cartCount;
    let products = await userHelpers.wishListProducts(userLog._id)
    res.render('user/wishlist',{userHead:true, userLog, cartCount, products})
})

router.post("/coupon", verifyLogin, async (req, res) => {
  let userLog = req.session.user;
  req.session.couponData = req.body.coupon;
  let amount = {};
  cartHelpers.couponCheck(userLog._id, req.body).then((response) => {
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
});

router.get("/add-to-cart/:id", verifyLogin, (req, res) => {
  let userLog = req.session.user;
  cartHelpers.addToCart(req.params.id, userLog?._id).then((data) => {
    res.json(data);
  });
});

router.get("/add-to-wishlist/:id", verifyLogin, (req, res) => {
  try {
    let userLog = req.session.user;
    userHelpers.addToWishlist(req.params.id, userLog?._id).then((status) => {
      res.json(status);
    });
  } catch (error) {
    console.log(error);
  }
});



router.post("/delete-cart-product", verifyLogin, (req, res) => {
  cartHelpers.deleteCartProduct(req.body).then((response) => {
    res.json({ removeProduct: true });
  });
});

router.post("/change-product-quantity", verifyLogin, (req, res, next) => {
  let userLog = req.session.user;
  cartHelpers.changeProductQuantity(req.body).then(async (response) => {
    let total = await cartHelpers.getTotalAmount(userLog._id);
    if (total > 0) {
      response.total = total;
    }
    console.log(response);
    res.json(response);
  });
});

router.get("/checkout", verifyLogin, verifyCartCount, async (req, res) => {
  let userLog = req.session.user;
  let cartCount = req.session.cartCount;
  let wallet = await userHelpers.getWallet(userLog._id);
  let products = await cartHelpers.getCartProducts(userLog._id);
  let total = await cartHelpers.getTotalAmount(userLog._id);
  if (req.session.couponedAmount) {
    total = req.session.couponedAmount.grandtotal;
  }
  userHelpers.getUserAddress(userLog._id).then((address) => {
    res.render("user/checkout", {
      products,
      address,
      wallet,
      total,
      userLog,
      cartCount,
      userHead: true,
    });
  });
});

router.post(
  "/fetch-single-address",
  verifyLogin,
  verifyCartCount,
  (req, res) => {
    let index = parseInt(req.body.index);
    let userLog = req.session.user;
    userHelpers.getSingleAddress(index, userLog._id).then((address) => {
      res.json(address);
    });
  }
);

//add address checkout
router.post("/add-address", (req, res) => {
  let userLog = req.session.user;
  // console.log(userLog);
  userHelpers.addAdrress(req.body, userLog._id).then((address) => {
    res.redirect("/checkout");
  });
});

router.post("/setAddress", verifyLogin, verifyCartCount, (req, res) => {
  req.body.name = req.session.user.username;
  console.log("inside set address")
  console.log(req.body);
  req.session.checkoutAddress = req.body;
  res.json({success: true})
});

router.get("/place-order", verifyLogin, verifyCartCount, async (req, res) => {
  let userLog = req.session.user;
  let cartCount = req.session.cartCount;
  let total = await cartHelpers.getTotalAmount(userLog._id);
  let wallet = await userHelpers.getWallet(userLog._id);
  req.session.walletBalance = wallet.wallet;
  if (req.session.couponedAmount) {
    total = req.session.couponedAmount.grandtotal;
  }
  res.render("user/place-order", {
    total,
    userLog,
    cartCount,
    wallet,
    userHead: true,
  });
});

router.post("/place-order", verifyLogin, async (req, res) => {
  let userLog = req.session.user;
  let deliveryAddress = req.session.checkoutAddress;
  console.log(deliveryAddress);
  let walletBalance = req.session?.walletBalance;
  let products = await cartHelpers.getCartProductList(userLog._id);
  let totalPrice = await cartHelpers.getTotalAmount(userLog._id);
  let discount;
  if (req.session.couponedAmount) {
    totalPrice = req.session.couponedAmount.grandtotal;
    discount = req.session.couponedAmount.discountamount;
    cartHelpers.userAppliedCoupon(userLog._id, req.session.couponData);
    req.session.couponedAmount = null;
  }
  req.session.total = totalPrice;
  req.session.checkoutAddress = null;
  req.session.walletBalance = null;
  userHelpers
    .placeOrder(
      products,
      deliveryAddress,
      totalPrice,
      req.body.method,
      userLog._id,
      discount
    )
    .then((response) => {
      req.session.orderId = response.insertedId.toString();
      if (req.body["method"] == "COD") {
        res.json({ cod: true });
        userHelpers.clearCart(userLog._id);
      } else if (req.body["method"] == "razorpay") {
        userHelpers
          .generateRazorPay(req.session.orderId, totalPrice)
          .then((order) => {
            order.razorpay = true;
            res.json(order);
          });
      } else if (req.body["method"] == "paypal") {
        userHelpers.priceConvert(totalPrice).then((convertedPrice) => {
          req.session.totalPrice = convertedPrice;
          userHelpers
            .generatePayPal(req.session.orderId, convertedPrice)
            .then((data) => {
              res.json(data);
            });
        });
      } else if (req.body["method"] == "wallet") {
        if (walletBalance < totalPrice) {
          res.json({ walletLow: true });
        } else {
          walletBalance = walletBalance - totalPrice;
          userHelpers.updateWallet(
            userLog._id,
            walletBalance,
            req.session.orderId,
            totalPrice
          );
          userHelpers.clearCart(userLog._id);
          userHelpers.changePaymentStatus(req.session.orderId).then(() => {
            res.json({ walletSuccess: true });
          });
        }
      }
    });
});

//wallet history
router.get("/show-wallet", verifyLogin, async (req, res) => {
  let userLog = req.session.user;
  let cartCount = req.session.cartCount;
  try {
    let walletDetails = await userHelpers.getWallet(userLog._id);
    walletDetails = walletDetails?.walletHistory?.reverse();
    res.render("user/show-wallet", {
      userHead: true,
      walletDetails,
      userLog,
      cartCount,
    });
  } catch (error) {
    console.log(error);
  }
});

//razorpay verify Amount

router.post("/verify-payment", verifyLogin, (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers
      .changePaymentStatus(req.body["order[receipt]"])
      .then(() => {
        res.json({ razor: true });
        userHelpers.clearCart(req.session.user._id);
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: false });
      });
  });
});

//paypal
router.get("/success", verifyLogin, (req, res) => {
  let amount = req.session.totalPrice;
  let orderIdPaypal = req.session.orderId;
  userHelpers.changePaymentStatus(orderIdPaypal).then(() => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const execute_payment_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: amount,
          },
        },
      ],
    };

    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      function (error, payment) {
        if (error) {
          console.log(error.response);
          throw error;
        } else {
          console.log(JSON.stringify(payment));
          res.redirect("/shop");
        }
      }
    );
  });
  userHelpers.clearCart(req.session.user._id);
});

router.get('/clear-cart', verifyLogin, ((req, res)=>{
  userHelpers.clearCart(req.session.user._id).then(()=>{
    res.json({cleared:true})
  })
}))

router.get("/cancel", verifyLogin, (req, res) => {
  res.send("Cancelled");
});
module.exports = router;
