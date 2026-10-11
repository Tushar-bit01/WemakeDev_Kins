const express = require('express');
const router = express.Router();
const { jwtCheck, requireRole } = require('../middleware/auth');
const { createOrder, verifyPayment, getPlans, getPaymentHistory } = require('../controllers/payments.controller');

router.get('/plans', getPlans);
router.get('/history', jwtCheck, requireRole('vendor', 'user'), getPaymentHistory);
router.post('/createOrder', jwtCheck, requireRole('vendor', 'user'), createOrder);
router.post('/verifyPayment', jwtCheck, requireRole('vendor', 'user'), verifyPayment);

module.exports = router;