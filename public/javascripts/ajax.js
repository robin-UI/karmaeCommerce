console.log("inside ajax")

function addToCart(proId) {
  
  $.ajax({
    url: "/add-to-cart/" + proId,
    method: "get",
    success: (response) => {
      
      if (response.status) {
        let count = $("#cart-count").html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
        swal("Item Added to Cart", { button: false, timer: 900 });
      } else if (response.alertOnly) {
        swal("Item Added to Cart", { button: false, timer: 900 });
      } else {
        window.location.href = "/user-orders-list";
      }
    },
  })
    .done(() => {
      // window.location.href='/add-to-cart/:id'
    })
    .catch((e) => console.log("header.hbs error"));
}

function deleteCartProduct(proId, cartId) {
  $.ajax({
    url: "/delete-cart-product",
    data: {
      productId: proId,
      cartId: cartId,
    },
    method: "post",
    success: (response) => {
      swal("Product removed from cart", { button: false, timer: 900 }).then(
        () => {
          location.reload();
        }
      );
    },
  });
}

function clearCart() {
  swal({ text: "Do you want to Clear Cart", dangerMode: true, buttons: true })
    .then((here) => {
      if(here){
        $.ajax({
          url: "/clear-cart",
          method: "get",
          success: (response) => {
            location.reload();
          },
        });
      }
    });
}

function changeQuantity(cartId, proId, count, dummy) {
  event.preventDefault();
  let quantity = parseInt(document.getElementById(proId).value);
  
  count = parseInt(count);
  $.ajax({
    url: "/change-product-quantity",
    data: {
      cart: cartId,
      product: proId,
      count: count,
      quantity: quantity,
    },
    method: "post",
    success: (response) => {
      if (response.removeProduct) {
        // alert("Product Removed from cart");
        swal("Product removed from cart", { button: false, timer: 900 }).then(
          () => {
            location.reload();
          }
        );
      } else {
        document.getElementById(proId).value = quantity + count;
        console.log(count);
        document.getElementById("total").innerHTML = "₹ " + response.total;
        document.getElementById('subTotal'+proId).innerText= "₹ "+ response.subTotal
        document.getElementById("total-price").innerHTML =
          "₹ " + response.total;
          
      }
    },
  });
}

function fetchAddress(index) {
  let houseName = document.getElementById("address");
  let street = document.getElementById("town");
  let state = document.getElementById("state");
  let pin = document.getElementById("pincode");
  $.ajax({
    url: "/fetch-single-address",
    data: {
      index: index,
    },
    method: "post",
    success: (address) => {
      houseName.value = address.Housename;
      street.value = address.Streetname;
      state.value = address.State;
      pin.value = address.Pin;
    },
  });
}

function addToWishlist(proId, name) {
  $.ajax({
    url: "/add-to-wishlist/" + proId,
    method: "get",
    success: (response) => {
      if (response.removed) {
        document.getElementById("wishIcon" + proId).className =
          "pe-7s-like icon";
        swal(name + " removed from wishlist", { button: false, timer: 900 });
      } else if (response.added) {
        swal(name + " Added to wishList", { button: false, timer: 600 });
        document.getElementById("wishIcon" + proId).className = "fa fa-heart";
      } else {
        window.location.href = "/user-orders-list";
      }
    },
  });
}

function removeWishlist(proId, name) {
  $.ajax({
    url: "/add-to-wishlist/" + proId,
    method: "get",
    success: (response) => {
      if (response.removed) {
        // swal({ text: name + " removed from wishlist", dangerMode: true });
        swal(name + " removed from wishList", {
          button: false,
          timer: 800,
        }).then(() => {
          location.reload();
        });
      }
    },
  });
}

function setAddress(data) {
  let Streetname = document.getElementById("streetname").innerText
  let housename = document.getElementById("housename").innerText
  let state = document.getElementById("state").innerText
  let pin = document.getElementById("pin").innerText
  
  $.ajax({
    url: "/setAddress",
    data: {
      index: data - 1,
      Streetname: Streetname,
      housename: housename,
      state: state,
      pin: pin 
    },
    method: "POST",
    success: (response) => {
      if(response.success){
        swal("Address set successfully")
      }
    }
  })
}
