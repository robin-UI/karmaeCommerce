var MongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
    const url='mongodb://localhost:27017'
    // const url='mongodb+srv://cozmoAdmin:cozmo%21%40%23Admin123@cluster0.si0dcbo.mongodb.net/?retryWrites=true&w=majority'
    const dbname='aclone'
    MongoClient.connect(url,(err,data)=>{
         if(err) return done(err)
         state.db=data.db(dbname)
         done()
    })

}

module.exports.get=function(){
    return state.db
}