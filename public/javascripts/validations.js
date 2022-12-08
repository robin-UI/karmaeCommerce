var nameEr = document.getElementById('nameEr')
var emailEr = document.getElementById('emailEr')
var phoneEr = document.getElementById('phoneEr')
var passwordEr = document.getElementById('passwordEr')
var submitEr = document.getElementById('submitEr')
// ------------------validation edit profile-----------------

function validatecName() {
    var name = document.getElementById('Name').value
    if (name.length == 0) {
        nameEr.innerHTML = "Name is required";
        return false;
    }
   
    if (name.length < 3) {
        nameEr.innerHTML = "Enter a valid name";
        return false;
    }
    return true
}


function validatecEmail() {
    var email = document.getElementById('Email').value
    if (email.length == 0) {
        emailEr.innerHTML = "Email is required";
        return false;

    }
    if (!email.match(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/)) {
        emailEr.innerHTML = "Email is invalid";
        return false;
    }

    return true;


}

function validatecPhone() {
    var phone = document.getElementById('Phone').value
    if (phone.length == 0) {
        phoneEr.innerHTML = 'Phone number is required';
        return false;

    }
    if (!phone.match(/^[1-9]{1}[0-9]{9}$/)) {
        phoneEr.innerHTML = 'write 10 digits';
        return false;
    }

    return true
}

function validateEform()
{
    if(!validatecName()||!validatecEmail()||!validatecPhone())
   
    { submitEr.innerHTML = 'Empty field is not allowed'
   return false;
   }
    
}

// --------------------password reset validation---------------

var currentapasswordEr = document.getElementById('currentpasswordEr')

var newapasswordEr = document.getElementById('newpasswordEr')

var confirmapasswordEr = document.getElementById('confirmpasswordEr')
var passwordsubmitEr =   document.getElementById('passwordsubmitEr')


function validateCurrentPassword()
{
    let password = document.getElementById('currentpassword').value
    if(password.length==0)
    {
        currentapasswordEr.innerHTML = 'password required'
       return false;
    }

    if(password.length<4)
    {
        currentapasswordEr.innerHTML= 'password length should be minimum four'
        return false;
    }else{
        currentapasswordEr.innerHTML= ''
        return true;
    }

    return true;

}

function validateNewPassword()
{
    let password = document.getElementById('newpassword').value
    if(password.length==0)
    {
        newapasswordEr.innerHTML = 'password required'
       return false;
    }

    if(password.length<4)
    {
        newapasswordEr.innerHTML= 'password length should be minimum four'
        return false;
    }else{
        newapasswordEr.innerHTML= ''
        return true;
    }

    return true;

}

function validateConfirmPassword()
{
    let password = document.getElementById('confirmpassword').value
    if(password.length==0)
    {
        confirmapasswordEr.innerHTML = 'password required'
       return false;
    }

    if(password.length<4)
    {
        confirmapasswordEr.innerHTML= 'password length should be minimum four'
        return false;
    }else{
        confirmapasswordEr.innerHTML= ''
        return true;
    }

    return true;

}

function validatePform()
{
    
    if(!validateCurrentPassword()||!validateNewPassword()||!validateConfirmPassword())
   
    { passwordsubmitEr.innerHTML = 'Empty field is not allowed'
   return false;
   }

}

// -------------------all address validation----------------

var addressSubmitEr = document.getElementById('addresssubmitEr')
var addressEr = document.getElementById('caddress-error')
var townEr = document.getElementById('ctown-error')
var stateEr = document.getElementById('cstate-error')
var pincodeEr = document.getElementById('cpincode-error')


 function validatecAddress()
 {

     var address = document.getElementById('address').value

     if(address.length<=3)
     {
        addressEr.innerHTML = 'write address'
        return false;
     }

     return true;
 }


 function validatecTown()
 {

    var town = document.getElementById('town').value
    if(town.length<=3)
    {
        townEr.innerHTML = 'write town'
        return false;

    }

    return true;
 }

function validatecState()
{
   var state = document.getElementById('state').value
   if(state.length<=3)
    {
        stateEr.innerHTML = 'write state'
        return false;

    }

    return true;

}

function validatecPin()
{
   var pincode = document.getElementById('pincode').value
   if(pincode.length<=5)
    {
        pincodeEr.innerHTML = 'pincode must be 6 digits'
        return false;

    }

    return true;

}


function validatecform()
{
    if(!validatecAddress()||!validatecTown()||!validatecState()||!validatecPin())
   
    { addressSubmitEr.innerHTML = 'Empty field is not allowed'
   return false;
   }
    
}