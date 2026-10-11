// src/routes/vendor.routes.js

const express = require('express');
const router = express.Router();
const VendorController = require('../controllers/vendor.controller');
const { jwtCheck, requireRole } = require('../middleware/auth');

// Reusable vendor auth guard
const vendorAuth = [jwtCheck, requireRole('vendor')];

// Public routes
router.get('/link/:token',          VendorController.resolveLink);
router.post('/link/:token/submit',  VendorController.handleCustomerSubmission);

// Protected routes (vendor JWT required)
router.get('/me',                                   ...vendorAuth, VendorController.getMe);
router.patch('/me',                                 ...vendorAuth, VendorController.updateMe);
router.get('/me/customers',                         ...vendorAuth, VendorController.getMyCustomers);
router.get('/me/customers/:customerId',             ...vendorAuth, VendorController.getCustomerById);
router.patch('/me/customers/:customerId/status',    ...vendorAuth, VendorController.updateCustomerStatus);
router.get('/me/invite-link',                       ...vendorAuth, VendorController.getInviteLink);
router.get('/profile/:vendorId',                    ...vendorAuth, VendorController.getProfile);
router.get('/:vendorId/submissions',                ...vendorAuth, VendorController.getSubmissions);

module.exports = router;