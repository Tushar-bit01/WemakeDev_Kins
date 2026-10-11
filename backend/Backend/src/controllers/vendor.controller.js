// src/controllers/vendor.controller.js
// Handles HTTP layer for all vendor-related endpoints

const VendorService = require('../services/vendor.service');
const VendorModel = require('../models/vendor.model');
const CustomerModel = require('../models/customer.model');
const { customerSubmissionSchema } = require('../middleware/vendor.validation');
const logger = require('../utils/logger');

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 86400 * 2) return 'yesterday';
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)} days ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ---------------------------------------------------------------------------
// Helper — extract numeric vendor ID from JWT sub ("vendor:1" → 1)
// ---------------------------------------------------------------------------
const extractVendorId = (sub) => {
  const parts = sub?.split(':');
  if (!parts || parts[0] !== 'vendor' || !parts[1]) return null;
  return parseInt(parts[1], 10);
};

const safeVendor = (vendor) => {
  if (!vendor) return null;
  const { password_hash, registration_token, ...safe } = vendor;
  return safe;
};

// ---------------------------------------------------------------------------
// GET /api/vendor/me
// ---------------------------------------------------------------------------
const getMe = async (req, res, next) => {
  try {
    const vendorId = extractVendorId(req.auth?.payload?.sub);
    if (!vendorId) return res.status(400).json({ success: false, error: 'Invalid token' });

    const vendor = await VendorModel.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

    const inviteLink = vendor.registration_token
      ? `${process.env.FRONTEND_URL}/invite/${vendor.registration_token}`
      : null;

    return res.status(200).json({
      success: true,
      data: { ...safeVendor(vendor), inviteLink },
    });
  } catch (error) {
    logger.error('VendorController.getMe error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/vendor/me
// ---------------------------------------------------------------------------
const updateMe = async (req, res, next) => {
  try {
    const vendorId = extractVendorId(req.auth?.payload?.sub);
    if (!vendorId) return res.status(400).json({ success: false, error: 'Invalid token' });

    const {
      companyName, contactName, mobile, city, state, pincode,
      discom, defaultPanelWattage, gstNumber, nationalPortalVendorId,
      serviceArea, yearsActive, teamSize, avgInstallKw, avgInstallKW, avatar, photo
    } = req.body;

    const updated = await VendorModel.updateById(vendorId, {
      companyName, contactName, mobile, city, state, pincode,
      discom, defaultPanelWattage, gstNumber, nationalPortalVendorId,
      serviceArea, yearsActive, teamSize,
      avgInstallKw: avgInstallKw || avgInstallKW,
      avatar, photo,
    });

    if (!updated) return res.status(404).json({ success: false, error: 'Vendor not found' });

    return res.status(200).json({ success: true, data: safeVendor(updated) });
  } catch (error) {
    logger.error('VendorController.updateMe error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/vendor/me/customers
// ---------------------------------------------------------------------------
const getMyCustomers = async (req, res, next) => {
  try {
    const vendorId = extractVendorId(req.auth?.payload?.sub);
    if (!vendorId) return res.status(400).json({ success: false, error: 'Invalid token' });

    const customers = await CustomerModel.findByVendorId(vendorId);

    const formatted = customers.map(c => ({
      id: c.id,
      name: c.name || c.username,
      email: c.email,
      address: c.address,
      state: c.state,
      load: c.load_kw ? parseFloat(c.load_kw) : null,
      bill: c.monthly_bill ? parseFloat(c.monthly_bill) : null,
      status: c.status,
      joined: c.created_at
        ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : null,
      lastActive: c.last_active_at ? timeAgo(c.last_active_at) : null,
      panels: c.finalized_design?.panelCount || null,
    }));

    return res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    logger.error('VendorController.getMyCustomers error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/vendor/me/customers/:customerId
// ---------------------------------------------------------------------------
const getCustomerById = async (req, res, next) => {
  try {
    const vendorId = extractVendorId(req.auth?.payload?.sub);
    if (!vendorId) return res.status(400).json({ success: false, error: 'Invalid token' });

    const customerId = parseInt(req.params.customerId, 10);
    if (isNaN(customerId)) return res.status(400).json({ success: false, error: 'Invalid customer ID' });

    const customer = await CustomerModel.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });

    if (customer.vendor_id !== vendorId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const formatted = {
      id: customer.id,
      username: customer.name || customer.username,
      email: customer.email,
      mobile: customer.mobile,
      address: customer.address,
      loadKw: customer.load_kw ? parseFloat(customer.load_kw) : null,
      monthlyBill: customer.monthly_bill ? parseFloat(customer.monthly_bill) : null,
      state: customer.state,
      discom: customer.discom,
      status: customer.status,
      submittedAt: customer.submitted_at,
      siteData: customer.site_data,
      panelOverride: customer.panel_override,
      finalizedDesign: customer.finalized_design,
      imagePath: customer.image_path,
      avatar: customer.avatar,
      createdAt: customer.created_at,
      lastActiveAt: customer.last_active_at,
    };

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    logger.error('VendorController.getCustomerById error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/vendor/me/customers/:customerId/status
// Body: { status: 'active' | 'pending' | 'inactive' }
// ---------------------------------------------------------------------------
const updateCustomerStatus = async (req, res, next) => {
  try {
    const vendorId = extractVendorId(req.auth?.payload?.sub);
    if (!vendorId) return res.status(400).json({ success: false, error: 'Invalid token' });

    const customerId = parseInt(req.params.customerId, 10);
    if (isNaN(customerId)) return res.status(400).json({ success: false, error: 'Invalid customer ID' });

    const { status } = req.body;
    if (!['active', 'pending', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, error: "status must be 'active', 'pending', or 'inactive'" });
    }

    const customer = await CustomerModel.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });

    if (customer.vendor_id !== vendorId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await CustomerModel.updateStatus(customerId, status);
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('VendorController.updateCustomerStatus error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/vendor/me/invite-link
// ---------------------------------------------------------------------------
const getInviteLink = async (req, res, next) => {
  try {
    const vendorId = extractVendorId(req.auth?.payload?.sub);
    if (!vendorId) return res.status(400).json({ success: false, error: 'Invalid token' });

    const vendor = await VendorModel.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

    const inviteLink = `${process.env.FRONTEND_URL}/invite/${vendor.registration_token}`;
    return res.status(200).json({ success: true, data: { inviteLink } });
  } catch (error) {
    logger.error('VendorController.getInviteLink error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/vendor/profile/:vendorId
// ---------------------------------------------------------------------------
const getProfile = async (req, res, next) => {
  try {
    const vendorId = parseInt(req.params.vendorId, 10);
    if (isNaN(vendorId)) return res.status(400).json({ success: false, error: 'Invalid vendor ID' });

    const vendor = await VendorModel.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

    return res.status(200).json({ success: true, data: safeVendor(vendor) });
  } catch (error) {
    logger.error('VendorController.getProfile error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/vendor/link/:token — PUBLIC
// ---------------------------------------------------------------------------
const resolveLink = async (req, res, next) => {
  try {
    const { token } = req.params;
    const vendorInfo = await VendorService.resolveVendorToken(token);

    if (!vendorInfo) {
      return res.status(404).json({ success: false, error: 'This registration link is invalid or has expired' });
    }

    return res.status(200).json({ success: true, data: vendorInfo });
  } catch (error) {
    logger.error('VendorController.resolveLink error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/vendor/link/:token/submit — PUBLIC
// ---------------------------------------------------------------------------
const handleCustomerSubmission = async (req, res, next) => {
  try {
    const { token } = req.params;
    const vendorInfo = await VendorService.resolveVendorToken(token);

    if (!vendorInfo) {
      return res.status(404).json({ success: false, error: 'This registration link is invalid or has expired' });
    }

    const parsed = customerSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    }

    const { username, email, mobile_number, location_address, lat, lng, load_kw } = parsed.data;

    const submission = await VendorService.handleCustomerSubmission({
      vendorId: vendorInfo.vendor_id,
      username, email,
      mobileNumber: mobile_number,
      locationAddress: location_address,
      lat, lng,
      loadKw: load_kw,
    });

    return res.status(201).json({
      success: true,
      message: 'Your details have been submitted. Your vendor will be in touch shortly.',
      data: { submission_id: submission.id, status: submission.status },
    });
  } catch (error) {
    logger.error('VendorController.handleCustomerSubmission error:', error);
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/vendor/:vendorId/submissions
// ---------------------------------------------------------------------------
const getSubmissions = async (req, res, next) => {
  try {
    const vendorId = parseInt(req.params.vendorId, 10);
    if (isNaN(vendorId)) return res.status(400).json({ success: false, error: 'Invalid vendor ID' });

    const submissions = await VendorService.getVendorSubmissions(vendorId);
    return res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    logger.error('VendorController.getSubmissions error:', error);
    next(error);
  }
};

module.exports = {
  getMe, updateMe, getMyCustomers, getCustomerById,
  updateCustomerStatus, getInviteLink, getProfile,
  resolveLink, handleCustomerSubmission, getSubmissions,
};