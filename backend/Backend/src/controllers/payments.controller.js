// src/controllers/payments.controller.js

const { createRazorpayInstance } = require('../config/razorpay.config');
const crypto = require('crypto');
const { pool } = require('../config/database');

const razorpayInstance = createRazorpayInstance();

// ---------------------------------------------------------------------------
// Helper — extract role and numeric ID from JWT sub
// sub is "vendor:1" or "user:1"
// ---------------------------------------------------------------------------
const extractIdentity = (sub) => {
  if (!sub) return null;
  const parts = sub.split(':');
  if (parts.length !== 2) return null;
  const role = parts[0];           // 'vendor' | 'user'
  const id   = parseInt(parts[1], 10);
  if (!['vendor', 'user'].includes(role) || isNaN(id)) return null;
  return { role, id };
};

// ---------------------------------------------------------------------------
// GET /api/payments/plans?entityType=vendor
// ---------------------------------------------------------------------------
exports.getPlans = async (req, res) => {
  try {
    const { entityType } = req.query;

    let query  = 'SELECT id, plan_name, entity_type, price, currency, description FROM plans';
    let params = [];

    if (entityType) {
      query += ' WHERE entity_type = $1';
      params.push(entityType);
    }

    query += ' ORDER BY price ASC';

    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, plans: result.rows });
  } catch (error) {
    console.error('Get plans error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/payments/createOrder
// Body: { planName, entityType }
// ---------------------------------------------------------------------------
exports.createOrder = async (req, res) => {
  const { planName, entityType } = req.body;

  try {
    const identity = extractIdentity(req.auth?.payload?.sub);
    if (!identity) {
      return res.status(400).json({ success: false, message: 'Invalid authentication token' });
    }

    // entityType in body must match the role in the JWT
    if (entityType !== identity.role) {
      return res.status(403).json({ success: false, message: 'Entity type does not match your account type' });
    }

    // Fetch plan
    const planResult = await pool.query(
      'SELECT * FROM plans WHERE plan_name = $1 AND entity_type = $2',
      [planName, entityType]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const plan   = planResult.rows[0];
    const amount = plan.price;

    // Create Razorpay order
    const options = {
      amount:   amount * 100,
      currency: 'INR',
      receipt:  `receipt_${Date.now()}`,
    };

    razorpayInstance.orders.create(options, async (err, order) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Something went wrong while creating order' });
      }

      // Save to payments table — use user_id or vendor_id based on role
      await pool.query(
        `INSERT INTO payments
           (user_id, vendor_id, plan_id, razorpay_order_id, amount, currency, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'created')`,
        [
          identity.role === 'user'   ? identity.id : null,
          identity.role === 'vendor' ? identity.id : null,
          plan.id,
          order.id,
          amount,
          'INR',
        ]
      );

      return res.status(200).json({
        success: true,
        order,
        plan: { name: plan.plan_name, price: plan.price },
      });
    });

  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/payments/verifyPayment
// Body: { order_id, payment_id, signature }
// ---------------------------------------------------------------------------
exports.verifyPayment = async (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(order_id + '|' + payment_id);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature === signature) {
    try {
      await pool.query(
        `UPDATE payments
         SET status = 'verified', razorpay_payment_id = $1, updated_at = NOW()
         WHERE razorpay_order_id = $2`,
        [payment_id, order_id]
      );
      return res.status(200).json({ success: true, message: 'Payment Verified!!!' });
    } catch (error) {
      console.error('DB update error:', error);
      return res.status(500).json({ success: false, message: 'Payment verified but failed to update database' });
    }
  } else {
    await pool.query(
      `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE razorpay_order_id = $1`,
      [order_id]
    );
    return res.status(400).json({ success: false, message: 'Payment not verified' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/payments/history
// ---------------------------------------------------------------------------
exports.getPaymentHistory = async (req, res) => {
  try {
    const identity = extractIdentity(req.auth?.payload?.sub);
    if (!identity) {
      return res.status(400).json({ success: false, message: 'Invalid authentication token' });
    }

    let result;

    if (identity.role === 'user') {
      result = await pool.query(
        `SELECT p.id, p.razorpay_order_id, p.razorpay_payment_id,
                p.amount, p.currency, p.status, p.created_at,
                pl.plan_name, pl.description
         FROM payments p
         JOIN plans pl ON p.plan_id = pl.id
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC`,
        [identity.id]
      );
    } else if (identity.role === 'vendor') {
      result = await pool.query(
        `SELECT p.id, p.razorpay_order_id, p.razorpay_payment_id,
                p.amount, p.currency, p.status, p.created_at,
                pl.plan_name, pl.description
         FROM payments p
         JOIN plans pl ON p.plan_id = pl.id
         WHERE p.vendor_id = $1
         ORDER BY p.created_at DESC`,
        [identity.id]
      );
    }

    return res.status(200).json({ success: true, payments: result.rows });
  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};