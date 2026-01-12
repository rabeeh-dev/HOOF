const User = require('../model/userModels')
const bcrypt = require('bcrypt')

exports.signupPage = (req,res)=>{
    res.render('User/auth/register', {
        title: 'Register - ShoeStore',
        layout: 'layouts/user'
    });
}

exports.loginPage = (req,res)=>{
    res.render('User/auth/login', {
        title: 'Login - ShoeStore',
        layout: 'layouts/user'
    });
}
