const multer= require('multer')
const path = require("path")

const fileStorageEngine =multer.diskStorage({
    destination :(req,file,cb)=>{
      cb(null,"./public/image")
    },
    filename : (req,file,cb)=>{
      cb(null,Date.now()+"--"+path.extname(file.originalname));
    },
})
console.log("multer")
  
module.exports = upload = multer({ storage: fileStorageEngine})
  