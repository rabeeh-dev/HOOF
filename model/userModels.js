const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    fullName : {
        type : String,
        required : true,
        minlength : 2
    },
    email : {
        type : String ,
        required : true,
        unique : true,
        lowercase : true,
        index : true
    },
    password : {
        type : String ,
        minlength : 8,
        select: false
    },
    authProvider : {
        type : String , 
        enum : ['local','google'],
        required : true
    },
    googleId : {
        type : String,
        unique : true,
        sparse : true 
    }, 
    isEmailVerified : {
        type : Boolean,
        default : false
    },
    isBlocked : {
        type : Boolean,
        default : false
    },
},{
    timestamps : true
})

userSchema.pre("validate", function (next) {
  if (this.authProvider === "local" && !this.password) {
    return next(new Error("Password is required"));
  }

  if (this.authProvider === "google") {
    this.password = undefined;
  }

  next();
});

module.exports = mongoose.model("User",userSchema)