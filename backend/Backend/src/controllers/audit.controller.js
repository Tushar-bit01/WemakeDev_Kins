// src/controllers/audit.controller.js

const crypto = require('crypto');
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { fetchAndProcessImage, resolveCoordinates } = require('../services/satellite.service');

// ---------------------------------------------------------------------------
// Helper — extract numeric ID from JWT sub ("user:1" or "vendor:1")
// ---------------------------------------------------------------------------
const extractId = (sub) => {
  if (!sub) return null;
  const parts = sub.split(':');
  if (parts.length !== 2) return null;
  const id = parseInt(parts[1], 10);
  return isNaN(id) ? null : id;
};

// ---------------------------------------------------------------------------
// POST /audit/start
// ---------------------------------------------------------------------------
exports.startAudit = async (req, res) => {
  const { address, lat: rawLat, lng: rawLng, owner_name, owner_email, owner_phone } = req.body;

  if (!owner_name || !owner_email || !owner_phone) {
    return res.status(400).json({ success: false, message: 'Owner name, email and phone are required' });
  }

  try {
    const { lat, lng, resolvedAddress } = await resolveCoordinates({ address, lat: rawLat, lng: rawLng });
    const { imagePath } = await fetchAndProcessImage(lat, lng);

    // Resolve internal user ID from JWT sub (optional — audits can be anonymous)
    const sub = req.auth?.payload?.sub;
    const userId = sub?.startsWith('user:') ? extractId(sub) : null;

    const { rows } = await pool.query(
      `INSERT INTO audits
         (user_id, property_address, lat, lng, image_path, owner_name, owner_email, owner_phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING id`,
      [userId, resolvedAddress, lat, lng, imagePath, owner_name, owner_email, owner_phone]
    );

    return res.status(201).json({
      success: true,
      message: 'Audit started successfully',
      auditId: rows[0].id,
      status: 'pending',
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    logger.error('Audit start error', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// ---------------------------------------------------------------------------
// GET /audit/status/:id
// ---------------------------------------------------------------------------
exports.getAuditStatus = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, status, property_address, lat, lng, image_path,
              owner_name, owner_email, owner_phone, solar_system_size, roi_estimate,
              created_at, updated_at
       FROM audits WHERE id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Audit not found' });

    const audit = rows[0];

    // If request is authenticated, verify ownership
    const sub = req.auth?.payload?.sub;
    if (sub?.startsWith('user:')) {
      const userId = extractId(sub);
      if (userId && audit.user_id !== null && audit.user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    return res.status(200).json({ success: true, audit });
  } catch (error) {
    logger.error('Audit status error', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// ---------------------------------------------------------------------------
// POST /audit/webhooks/ai-results — called by the Python AI service
// ---------------------------------------------------------------------------
exports.receiveAiResults = async (req, res) => {
  const webhookSecret = req.headers['x-webhook-secret'];
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret || !expectedSecret || !crypto.timingSafeEqual(
    Buffer.from(webhookSecret), Buffer.from(expectedSecret)
  )) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { audit_id, solar_system_size, roi_estimate, status } = req.body;

  if (!audit_id) return res.status(400).json({ success: false, message: 'audit_id is required' });
  if (!['completed', 'failed'].includes(status)) {
    return res.status(400).json({ success: false, message: "status must be 'completed' or 'failed'" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE audits
       SET solar_system_size = $1, roi_estimate = $2, status = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, status, solar_system_size, roi_estimate, updated_at`,
      [solar_system_size || null, roi_estimate || null, status, audit_id]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Audit not found' });

    return res.status(200).json({ success: true, message: 'Audit results saved successfully', audit: rows[0] });
  } catch (error) {
    logger.error('Webhook error', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// ---------------------------------------------------------------------------
// POST /audit/webhooks/roof-results — called by FastAPI when analysis is done
// ---------------------------------------------------------------------------
exports.receiveRoofResults = async (req, res) => {
  const webhookSecret  = req.headers['x-webhook-secret'];
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret || !expectedSecret || !crypto.timingSafeEqual(
    Buffer.from(webhookSecret), Buffer.from(expectedSecret)
  )) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const {
    customer_id, entity_type, lat, lng,
    roof_polygon, free_space_polygon, obstacles, upper_roofs,
  } = req.body;

  logger.info('Roof webhook payload: ' + JSON.stringify(req.body));

  if (!customer_id || !entity_type) {
    return res.status(400).json({ success: false, message: 'customer_id and entity_type are required' });
  }

  // Respond immediately — don't make FastAPI wait for DB
  res.status(200).json({ success: true, message: 'Roof analysis results received' });

  // Process DB in background after responding
  try {
    const siteData = {
      roof_polygon,
      free_space_polygon,
      obstacles:   obstacles   || [],
      upper_roofs: upper_roofs || [],
    };

    if (entity_type === 'customer') {
      await pool.query(
        `UPDATE customers SET site_data = $2, updated_at = NOW() WHERE id = $1`,
        [customer_id, JSON.stringify(siteData)]
      );
    }

    logger.info(`Roof analysis saved: entity_type=${entity_type} id=${customer_id}`);
  } catch (error) {
    logger.error('Roof webhook DB error', { error: error.message });
  }
};