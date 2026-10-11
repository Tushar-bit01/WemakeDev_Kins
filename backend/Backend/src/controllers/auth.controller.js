// src/controllers/auth.controller.js
// Handles login/register for Vendors, Users, and Customers

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const VendorModel = require('../models/vendor.model');
const UserModel = require('../models/user.model');
const CustomerModel = require('../models/customer.model');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const signToken = ({ sub, role, email }) =>
  jwt.sign(
    { sub, role, email },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    }
  );

const sanitizeVendor = (v) => ({
  id: v.id,
  username: v.username,
  companyName: v.company_name,
  email: v.email,
  mobile: v.mobile,
  discom: v.discom,
  defaultPanelWattage: v.default_panel_wattage,
  gstNumber: v.gst_number,
  nationalPortalVendorId: v.national_portal_vendor_id,
  state: v.state,
  createdAt: v.created_at,
});

const sanitizeUser = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  mobile: u.mobile,
  address: u.address,
  lat: u.lat,
  lng: u.lng,
  sanctionedLoad: u.sanctioned_load,
  createdAt: u.created_at,
});

const sanitizeCustomer = (c) => ({
  id: c.id,
  username: c.username,
  email: c.email,
  mobile: c.mobile,
  sanctionedLoad: c.sanctioned_load,
  address: c.address,
  status: c.status,
  createdAt: c.created_at,
});

// ---------------------------------------------------------------------------
// POST /auth/vendor/login
// ---------------------------------------------------------------------------
const vendorLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const vendor = await VendorModel.findByEmail(email.toLowerCase().trim());
    if (!vendor) return res.status(401).json({ error: 'Invalid credentials' });

    const passwordMatch = await bcrypt.compare(password, vendor.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ sub: `vendor:${vendor.id}`, role: 'vendor', email: vendor.email });

    res.status(200).json({ message: 'Login successful', token, vendor: sanitizeVendor(vendor) });
  } catch (err) {
    logger.error('Vendor login error', err);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /auth/user/login
// ---------------------------------------------------------------------------
const userLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const user = await UserModel.findByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ sub: `user:${user.id}`, role: 'user', email: user.email });

    res.status(200).json({ message: 'Login successful', token, user: sanitizeUser(user) });
  } catch (err) {
    logger.error('User login error', err);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/customer/login
// Body: { email, password }
// ---------------------------------------------------------------------------
const customerLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const customer = await CustomerModel.findByEmail(email.toLowerCase().trim());
    if (!customer) return res.status(401).json({ error: 'Invalid credentials' });

    const passwordMatch = await bcrypt.compare(password, customer.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ sub: `customer:${customer.id}`, role: 'customer', email: customer.email });

    res.status(200).json({ message: 'Login successful', token, customer: sanitizeCustomer(customer) });
  } catch (err) {
    logger.error('Customer login error', err);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/customer/register
// Body: { username, email, password, mobile, sanctionedLoad, address, vendorId? }
// vendorId links the customer to the vendor who invited them
// ---------------------------------------------------------------------------
const customerRegister = async (req, res, next) => {
  try {
    const { username, email, password, mobile, sanctionedLoad, address, vendorId, lat, lng } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }

    const existingEmail = await CustomerModel.findByEmail(email.toLowerCase().trim());
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);

    // Fetch satellite image if coordinates provided
    let imagePath = null;
    let imageCoordinates = null;
    logger.info(`Attempting satellite fetch: lat=${lat} lng=${lng}`);

    if (lat && lng) {
      try {
        const { fetchAndProcessImage } = require('../services/satellite.service');
        const result = await fetchAndProcessImage(parseFloat(lat), parseFloat(lng));
        imagePath = result.imagePath;
        imageCoordinates = { x: result.finalX, y: result.finalY };  // ← no const
      } catch (err) {
        logger.warn('Satellite image fetch failed during registration', {
          message: err.message,
          stack: err.stack,
          error: JSON.stringify(err),
        });
      }
    }

    const customer = await CustomerModel.create({
      username,
      email: email.toLowerCase().trim(),
      passwordHash,
      mobile,
      sanctionedLoad,
      address,
      vendorId: vendorId || null,
      imagePath,
    });

    // Send to FastAPI for roof analysis (fire and forget)
    if (imagePath && lat && lng) {
      const { sendToFastAPI } = require('../services/fastapi.service');
      const imageUrl = `${process.env.R2_PUBLIC_URL}/${imagePath}`;
      sendToFastAPI({
        imageUrl,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        customerId: customer.id,
        entityType: 'customer',
        coordinates: imageCoordinates,
      });
    }

    // Auto-link to vendor_customer_submissions if email matches
    try {
      const { pool } = require('../config/database');
      await pool.query(
        `UPDATE vendor_customer_submissions
         SET user_id = $1, updated_at = NOW()
         WHERE email = $2 AND customer_id IS NULL`,
        [customer.id, customer.email]
      );
    } catch (err) {
      logger.warn('Failed to link customer to vendor submission', err.message);
    }

    const token = signToken({ sub: `customer:${customer.id}`, role: 'customer', email: customer.email });

    res.status(201).json({ message: 'Customer registered successfully', token, customer: sanitizeCustomer(customer) });
  } catch (err) {
    logger.error('Customer register error', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A customer with this email or username already exists' });
    }
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /auth/vendor/register
// ---------------------------------------------------------------------------
const vendorRegister = async (req, res, next) => {
  try {
    const {
      username, companyName, email, password, mobile,
      discom, defaultPanelWattage, gstNumber, nationalPortalVendorId, state,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }

    const existingEmail = await VendorModel.findByEmail(email);
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);

    const vendor = await VendorModel.create({
      username,
      companyName,
      email: email.toLowerCase().trim(),
      passwordHash,
      mobile,
      discom,
      defaultPanelWattage,
      gstNumber,
      nationalPortalVendorId,
      state,
    });

    const token = signToken({ sub: `vendor:${vendor.id}`, role: 'vendor', email: vendor.email });

    res.status(201).json({ message: 'Vendor registered successfully', token, vendor: sanitizeVendor(vendor) });
  } catch (err) {
    logger.error('Vendor register error', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A vendor with this email or username already exists' });
    }
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /auth/user/register
// ---------------------------------------------------------------------------
const userRegister = async (req, res, next) => {
  try {
    const { username, email, password, mobile, address, lat, lng, sanctionedLoad } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }

    const existing = await UserModel.findByUsername(username);
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);

    // Fetch satellite image if coordinates provided
    let imagePath = null;
    let imageCoordinates = null;

    if (lat && lng) {
      try {
        const { fetchAndProcessImage } = require('../services/satellite.service');
        const result = await fetchAndProcessImage(parseFloat(lat), parseFloat(lng));
        imagePath = result.imagePath;
        imageCoordinates = { x: result.finalX, y: result.finalY };  // ← no const
      } catch (err) {
        logger.warn('Satellite image fetch failed during registration', err.message);
      }
    }

    const user = await UserModel.create({
      username,
      email: email.toLowerCase().trim(),
      passwordHash,
      mobile,
      address,
      lat,
      lng,
      sanctionedLoad,
      imagePath,
    });

    // Send to FastAPI for roof analysis (fire and forget)
    if (imagePath && lat && lng) {
      const { sendToFastAPI } = require('../services/fastapi.service');
      const imageUrl = `${process.env.R2_PUBLIC_URL}/${imagePath}`;
      sendToFastAPI({
        imageUrl,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        customerId: user.id,
        entityType: 'user',
        coordinates: imageCoordinates,
      });
    }

    // Auto-link to vendor_customer_submissions if email matches
    try {
      const { pool } = require('../config/database');
      await pool.query(
        `UPDATE vendor_customer_submissions
         SET user_id = $1, updated_at = NOW()
         WHERE email = $2 AND user_id IS NULL`,
        [user.id, user.email]
      );
    } catch (err) {
      logger.warn('Failed to link user to vendor submission', err.message);
    }

    const token = signToken({ sub: `user:${user.id}`, role: 'user', email: user.email });

    res.status(201).json({ message: 'User registered successfully', token, user: sanitizeUser(user) });
  } catch (err) {
    logger.error('User register error', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A user with this email or username already exists' });
    }
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /auth/logout — works for vendor, customer, user
// ---------------------------------------------------------------------------
const logout = async (req, res, next) => {
  try {
    const token = req.auth.token;
    const role = req.auth.payload.role;

    // Get token expiry from JWT
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    // Add to blacklist
    const { pool } = require('../config/database');
    await pool.query(
      `INSERT INTO token_blacklist (token, role, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (token) DO NOTHING`,
      [token, role, expiresAt]
    );

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('Logout error', err);
    next(err);
  }
};

module.exports = {
  vendorLogin, userLogin, vendorRegister, userRegister,
  customerLogin, customerRegister, logout
};