
function addToCart(proId) {
  console.log("hello")
  $.ajax({
    url: '/add-to-cart/' + proId,
    method: 'get',
    success: (response) => {
      if (response.status) {
        let count = $('#cart-count').html()
        count = parseInt(count) + 1
        $("#cart-count").html(count)
        alert(success)
      }
    }
  })
}

// add to wishlist 

function addToWishList(proId) {

  console.log("wishlist working")
  $.ajax({
    url: '/add-to-wishlist/' + proId,
    method: 'get',
    success: (response) => {
      if (response.inserted) {
        alertify.success('Added to Wishlist'); 
        alertify.set('notifier','position','top-right')
            
        document.getElementById("a"+proId).hidden = false
        document.getElementById(proId).hidden = true
      }
      else if (response.wish) {
        alertify.success('Added to Wishlist'); 
        alertify.set('notifier','position','top-right')
        document.getElementById("a"+proId).hidden = false
        document.getElementById(proId).hidden = true
          
      } else if (response.wishAdded) {
        alertify.success('Added to Wishlist'); 
        alertify.set('notifier','position','top-right')

        document.getElementById("a"+proId).hidden = false
        document.getElementById(proId).hidden = true
      }
    }
  })

}


// delete to wishlist 

function deleteToWishList(proId) {

  console.log("wishlist working")
  $.ajax({
    url: '/delete-to-wishlist/' + proId,
    method: 'get',
    success: (response) => {
              
      alertify.error('Delted to Wishlist'); 
      alertify.set('notifier','position','top-right') 

      document.getElementById("a"+proId).hidden = true
      document.getElementById(proId).hidden = false
 
    }
  })
}

// change Quantity

function changeQuantity(event, cartId, prodId, userId, count) {
  let quantity = parseInt(document.getElementById(prodId).innerHTML)
  console.log("change quqntity");
  console.log(userId);
  event.preventDefault();
  if (quantity > 1) {
    $.ajax({
      url: '/changeProductQuantity',
      data: {
        cart: cartId,
        product: prodId,
        user: userId,
        quantity: quantity,
        count: count
      },
      method: 'post',
      success: (response) => {
        document.getElementById(prodId).innerHTML = quantity + count
        document.getElementById('total').innerHTML = response.total
        document.getElementById('a' + prodId).innerHTML = response.subtotal
      }
    })
  }
  else if (count == 1) {
    $.ajax({
      url: '/changeProductQuantity',
      data: {
        cart: cartId,
        product: prodId,
        quantity: quantity,
        user: userId,
        count: count
      },
      method: 'post',
      success: (response) => {
        console.log(response)
        document.getElementById(prodId).innerHTML = quantity + count
        document.getElementById('total').innerHTML = response.total
        document.getElementById('a' + prodId).innerHTML = response.subtotal
      }
    })

  }
}

// cancel order

// function cancelOrder(proId){
//   $.ajax({
//   url:'/add-to-cart/'+proId,
//   method:'get',
//   success:(response)=>{
//       if(response.status){
//           let count=$('#cart-count').html()
//           count=parseInt(count)+1
//           $("#cart-count").html(count)
//           alert(success)
//       }
//   }
// }) 



// }


// delete cart product 

function deleteCartProduct(proId) {
  console.log("delete cart");
  $.ajax({
    url: '/delete-cart-product',
    method: 'post',
    data: {
      product: proId
    },
    success: (response) => {
      if (response.status) {
        alertify.error('Deleted from  Cart'); 
        alertify.set('notifier','position','top-right')
        location.reload()
       
      }
    }
  })

}



// add to cart from wishlist 
function addCartWish(proId) {


  $.ajax({

    url: '/add-wish-product',
    method: 'post',
    data: {
      product: proId
    },
    success: (response) => {
      if(response.inserted){
        alertify.success('Added to Cart'); 
        alertify.set('notifier','position','top-right')

      }else{

        alertify.error('Already added to Cart'); 
        alertify.set('notifier','position','top-right')
      }
    }
  })
}


// delete from wishlist 

function deleteWishProduct(proId){
  $.ajax({
    url: '/delete-wishlist-product',
    method: 'post',
    data: {
      product: proId
    },
    success: (response) => {

      swal({
        title: "Your Item ",
        text: "is Deleted ",
        icon: "success",
        button: "ok",
      }).then(() => {

        location.reload()

        
      })
    }
})
}







