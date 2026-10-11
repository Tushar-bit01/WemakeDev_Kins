// src/routes/customer.routes.js

const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customer.controller');
const { jwtCheck, requireRole } = require('../middleware/auth');

// All routes require customer JWT
router.use(jwtCheck, requireRole('customer'));

router.get('/me', CustomerController.getMe);
router.patch('/me/site', CustomerController.updateSite);
router.post('/me/finalize', CustomerController.finalize);
router.patch('/me', CustomerController.updateMe);

module.exports = router;