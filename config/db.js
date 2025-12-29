const mongoose = require('mongoose')
const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Mongo DB is connected successfully")
    }catch(err){
        console.log("Mongo DB Connection Failed : ",err)
        process.exit(1)
    }
}

module.exports = connectDB  