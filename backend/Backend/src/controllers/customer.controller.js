// src/controllers/customer.controller.js
// Standalone customer entity — no dependency on users table

const CustomerModel = require('../models/customer.model');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Helper — extract numeric customer ID from JWT sub ("customer:1" → 1)
// ---------------------------------------------------------------------------
const extractCustomerId = (sub) => {
  const parts = sub?.split(':');
  if (!parts || parts[0] !== 'customer' || !parts[1]) return null;
  return parseInt(parts[1], 10);
};

// ---------------------------------------------------------------------------
// GET /api/customer/me
// ---------------------------------------------------------------------------
exports.getMe = async (req, res, next) => {
  try {
    const customerId = extractCustomerId(req.auth?.payload?.sub);
    if (!customerId) return res.status(400).json({ success: false, error: 'Invalid token' });

    const customer = await CustomerModel.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });

    await CustomerModel.touchLastActive(customerId);

    return res.status(200).json({ success: true, data: sanitizeCustomer(customer) });
  } catch (err) {
    logger.error('getMe error', err);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/customer/me/site
// Saves latest site editor result
// ---------------------------------------------------------------------------
exports.updateSite = async (req, res, next) => {
  try {
    const customerId = extractCustomerId(req.auth?.payload?.sub);
    if (!customerId) return res.status(400).json({ success: false, error: 'Invalid token' });

    const { siteData, panelOverride, loadKw } = req.body;

    const updated = await CustomerModel.updateSite(customerId, {
      siteData,
      panelOverride,
      loadKw: loadKw ? parseFloat(loadKw) : undefined,
    });

    if (!updated) return res.status(404).json({ success: false, error: 'Customer not found' });

    return res.status(200).json({ success: true, data: sanitizeCustomer(updated) });
  } catch (err) {
    logger.error('updateSite error', err);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/customer/me/finalize
// Saves finalizedDesign snapshot + sets status = 'pending'
// ---------------------------------------------------------------------------
exports.finalize = async (req, res, next) => {
  try {
    const customerId = extractCustomerId(req.auth?.payload?.sub);
    if (!customerId) return res.status(400).json({ success: false, error: 'Invalid token' });

    const { hudData } = req.body;

    if (!hudData) {
      return res.status(400).json({ success: false, error: 'hudData is required' });
    }

    const updated = await CustomerModel.finalize(customerId, hudData);
    if (!updated) return res.status(404).json({ success: false, error: 'Customer not found' });

    return res.status(200).json({
      success: true,
      finalizedAt: updated.finalized_at,
    });
  } catch (err) {
    logger.error('finalize error', err);
    next(err);
  }
};

// ── updateMe — replaces the existing stub ────────────────────────────────────
// Accepts all profile fields from CustomerProfile.jsx
exports.updateMe = async (req, res, next) => {
  try {
    const customerId = extractCustomerId(req.auth?.payload?.sub);
    if (!customerId) return res.status(400).json({ success: false, error: "Invalid token" });

    // Accept every field the frontend sends
    const {
      username,
      mobile,
      address,
      loadKw,
      monthlyBill,
      state,
      discom,
      avatar,
      photo,
    } = req.body;

    const updated = await CustomerModel.updateProfile(customerId, {
      username,
      mobile,
      address,
      loadKw: loadKw ? parseFloat(loadKw) : undefined,
      monthlyBill: monthlyBill ? parseFloat(monthlyBill) : undefined,
      state,
      discom,
      avatar,
      photo,
    });

    if (!updated) return res.status(404).json({ success: false, error: "Customer not found" });

    return res.status(200).json({ success: true, data: sanitizeCustomer(updated) });
  } catch (err) {
    logger.error("updateMe error", err);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Sanitize customer output
// ---------------------------------------------------------------------------
const sanitizeCustomer = (c) => ({
  id: c.id,
  username: c.username,
  email: c.email,
  mobile: c.mobile,
  sanctionedLoad: c.sanctioned_load ? parseFloat(c.sanctioned_load) : null,
  address: c.address,
  loadKw: c.load_kw ? parseFloat(c.load_kw) : null,
  monthlyBill: c.monthly_bill ? parseFloat(c.monthly_bill) : null,
  state: c.state,
  discom: c.discom,
  status: c.status,
  avatar: c.avatar,
  photo: c.photo,
  submittedAt: c.submitted_at,
  siteData: c.site_data,
  panelOverride: c.panel_override,
  finalizedDesign: c.finalized_design,
  lastActiveAt: c.last_active_at,
  createdAt: c.created_at,
});