const express = require('express');
const router = express.Router();
const { authLimiter, strictAuthLimiter, jwtCheck } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');
const { forgotPassword, resetPassword } = require('../controllers/passwordReset.controller');

// Vendor auth
router.post('/vendor/register', authLimiter,       authController.vendorRegister);
// router.post('/vendor/login',    strictAuthLimiter,  authController.vendorLogin);
router.post('/vendor/login', authLimiter, authController.vendorLogin);

// Customer auth
router.post('/customer/register', authLimiter,       authController.customerRegister);
router.post('/customer/login',    strictAuthLimiter,  authController.customerLogin);

// User auth
router.post('/user/register',   authLimiter,        authController.userRegister);
router.post('/user/login',      strictAuthLimiter,  authController.userLogin);

// Password reset
router.post('/forgot-password', authLimiter,        forgotPassword);
router.post('/reset-password',  authLimiter,        resetPassword);

// Logout
router.post('/logout', jwtCheck, authController.logout);

module.exports = router;