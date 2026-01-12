

const express = require('express');
const router = express.Router();
const userController = require('../controller/userController')

router.get('/signup',userController.signupPage)
// router.post('/signup',userController)

router.get('/login',userController.loginPage)
// router.post('/login',userController)


module.exports = router

