// src/models/vendor.model.js
// Represents the `vendors` table. Password is stored as bcrypt hash.

const { pool } = require('../config/database');
;

class VendorModel {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------
  static async create({
    username, companyName, email, passwordHash, mobile,
    discom, defaultPanelWattage, gstNumber, nationalPortalVendorId, state,
  }) {

    const crypto = require('crypto')
    const registrationToken = crypto.randomBytes(32).toString('hex');

    const query = `
      INSERT INTO vendors
        (username, company_name, email, password_hash, mobile,
         discom, default_panel_wattage, gst_number, national_portal_vendor_id, state)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;
    const values = [
      username, companyName, email, passwordHash, mobile,
      discom, defaultPanelWattage, gstNumber, nationalPortalVendorId, state,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------
  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM vendors WHERE email = $1', [email]);
    return rows[0] || null;
  }


  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------
  static async updateById(id, {
    companyName, contactName, mobile, city, state, pincode,
    discom, defaultPanelWattage, gstNumber, nationalPortalVendorId,
    serviceArea, yearsActive, teamSize, avgInstallKw, avatar, photo
  }) {
    const query = `
    UPDATE vendors SET
      company_name              = COALESCE($2,  company_name),
      contact_name              = COALESCE($3,  contact_name),
      mobile                    = COALESCE($4,  mobile),
      city                      = COALESCE($5,  city),
      state                     = COALESCE($6,  state),
      pincode                   = COALESCE($7,  pincode),
      discom                    = COALESCE($8,  discom),
      default_panel_wattage     = COALESCE($9,  default_panel_wattage),
      gst_number                = COALESCE($10, gst_number),
      national_portal_vendor_id = COALESCE($11, national_portal_vendor_id),
      service_area              = COALESCE($12, service_area),
      years_active              = COALESCE($13, years_active),
      team_size                 = COALESCE($14, team_size),
      avg_install_kw            = COALESCE($15, avg_install_kw),
      avatar                    = COALESCE($16, avatar),
      photo                     = $17,
      updated_at                = NOW()
    WHERE id = $1
    RETURNING *;
  `;
    const { rows } = await pool.query(query, [
      id, companyName, contactName, mobile, city, state, pincode,
      discom, defaultPanelWattage, gstNumber, nationalPortalVendorId,
      serviceArea, yearsActive, teamSize, avgInstallKw, avatar, photo,
    ]);
    return rows[0] || null;
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------
  static async deleteById(id) {
    await pool.query('DELETE FROM vendors WHERE id = $1', [id]);
  }

  static async findByToken(token) {
    const { rows } = await pool.query(
      'SELECT * FROM vendors WHERE registration_token = $1',
      [token]
    );
    return rows[0] || null;
  }

  static async createSubmission({ vendorId, username, email, mobileNumber, locationAddress, lat, lng, loadKw }) {
    const query = `
    INSERT INTO vendor_customer_submissions
      (vendor_id, username, email, mobile_number, location_address, lat, lng, load_kw)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
    const { rows } = await pool.query(query, [
      vendorId, username, email, mobileNumber, locationAddress, lat, lng, loadKw
    ]);
    return rows[0];
  }

  static async updateSubmissionStatus(submissionId, status) {
    const { rows } = await pool.query(
      `UPDATE vendor_customer_submissions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
      [status, submissionId]
    );
    return rows[0];
  }

  static async findSubmissionsByVendor(vendorId) {
    const { rows } = await pool.query(
      `SELECT * FROM vendor_customer_submissions WHERE vendor_id = $1 ORDER BY created_at DESC`,
      [vendorId]
    );
    return rows;
  }
}



module.exports = VendorModel;