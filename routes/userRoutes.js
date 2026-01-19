

const express = require('express');
const router = express.Router();
const userController = require('../controller/userController')

router.get('/signup',userController.signupPage)

router.post('/signup', (req, res, next) => {
  console.log('POST /user/signup HIT');
  next();
}, userController.signup);

router.get('/verify-otp', (req, res) => {
  res.render('User/auth/verify-otp', {
    title: 'Verify OTP',
    layout: 'layouts/user'
  });
});

router.get('/login',userController.loginPage)
router.post('/login',userController.login)
router.post('/verify-otp', userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);




module.exports = router

