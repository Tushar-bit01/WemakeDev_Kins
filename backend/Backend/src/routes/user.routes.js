// src/routes/user.routes.js
// Protected user-resource endpoints — all require a valid JWT

const express = require('express');
const router = express.Router();
const { jwtCheck, requireRole } = require('../middleware/auth');
const userController = require('../controllers/user.controller');

// All routes below require a valid JWT with role 'user'
router.use(jwtCheck, requireRole('user'));

router.get('/',    userController.getProfile);
router.put('/',    userController.updateProfile);
router.delete('/', userController.deleteAccount);

module.exports = router;