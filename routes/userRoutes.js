

const express = require('express');
const router = express.Router();
const userController = require('../controller/userController')

router.get('/signup',userController.signupPage)

router.post('/signup', (req, res, next) => {
  console.log('POST /user/signup HIT');
  next();
}, userController.signup);


router.get('/login',userController.loginPage)
router.post('/login',userController.login)


module.exports = router

