// src/models/customer.model.js
// Standalone customer entity — independent of users table

const { pool } = require('../config/database');

class CustomerModel {

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------
  static async create({ username, email, passwordHash, mobile, sanctionedLoad, address, vendorId, imagePath }) {
    const query = `
    INSERT INTO customers
      (username, email, password_hash, mobile, sanctioned_load, address, vendor_id, image_path, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
    RETURNING *;
  `;
    const { rows } = await pool.query(query, [
      username, email, passwordHash, mobile, sanctionedLoad, address, vendorId || null, imagePath || null,
    ]);
    return rows[0];
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------
  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    return rows[0] || null;
  }


  static async findByVendorId(vendorId) {
    const query = `
    SELECT
      id, username, email, mobile, address, load_kw, monthly_bill,
      state, status, submitted_at, last_active_at, created_at,
      site_data, panel_override, finalized_design,
      CASE
        WHEN last_active_at >= NOW() - INTERVAL '7 days'  THEN 'active'
        WHEN last_active_at >= NOW() - INTERVAL '30 days' THEN 'pending'
        ELSE 'inactive'
      END AS activity_status
    FROM customers
    WHERE vendor_id = $1
    ORDER BY created_at DESC;
  `;
    const { rows } = await pool.query(query, [vendorId]);
    return rows;
  }

  // -------------------------------------------------------------------------
  // UPDATE — site editor data
  // -------------------------------------------------------------------------
  static async updateSite(id, { siteData, panelOverride, loadKw }) {
    const query = `
      UPDATE customers SET
        site_data      = COALESCE($2, site_data),
        panel_override = COALESCE($3, panel_override),
        load_kw        = COALESCE($4, load_kw),
        updated_at     = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      id,
      siteData ? JSON.stringify(siteData) : null,
      panelOverride ? JSON.stringify(panelOverride) : null,
      loadKw || null,
    ]);
    return rows[0] || null;
  }

  // -------------------------------------------------------------------------
  // FINALIZE — save hudData snapshot + set status = 'pending'
  // -------------------------------------------------------------------------
  static async finalize(id, hudData) {
    const query = `
      UPDATE customers SET
        finalized_design = $2,
        finalized_at     = NOW(),
        submitted_at     = NOW(),
        status           = 'pending',
        updated_at       = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id, JSON.stringify(hudData)]);
    return rows[0] || null;
  }

  // -------------------------------------------------------------------------
  // UPDATE — status (by vendor)
  // -------------------------------------------------------------------------
  static async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE customers SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;`,
      [id, status]
    );
    return rows[0] || null;
  }

  // -------------------------------------------------------------------------
  // TOUCH last active
  // -------------------------------------------------------------------------
  static async touchLastActive(id) {
    await pool.query(
      'UPDATE customers SET last_active_at = NOW() WHERE id = $1',
      [id]
    );
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------
  static async deleteById(id) {
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
  }

  // Update Profile
  static async updateProfile(id, { username, mobile, address, loadKw, monthlyBill, state, discom, avatar, photo }) {
    const query = `
    UPDATE customers SET
      username         = COALESCE($2,  username),
      mobile           = COALESCE($3,  mobile),
      address          = COALESCE($4,  address),
      load_kw          = COALESCE($5,  load_kw),
      monthly_bill     = COALESCE($6,  monthly_bill),
      state            = COALESCE($7,  state),
      discom           = COALESCE($8,  discom),
      avatar           = COALESCE($9,  avatar),
      photo            = $10,
      updated_at       = NOW()
    WHERE id = $1
    RETURNING *;
  `;
    const { rows } = await pool.query(query, [
      id, username, mobile || null, address || null,
      loadKw || null, monthlyBill || null, state || null, discom || null, avatar || null, photo || null,
    ]);
    return rows[0] || null;
  }
}

module.exports = CustomerModel;