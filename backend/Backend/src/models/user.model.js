//This file represents your User table in code, think like SQL wrapped in JavaScript

// src/models/user.model.js
// Represents the `users` table. auth0_id removed; password_hash added.

const { pool } = require('../config/database');

class UserModel {
    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------
    static async create({ username, email, passwordHash, mobile, address, lat, lng, sanctionedLoad, imagePath }) {
        const query = `
    INSERT INTO users
      (username, email, password_hash, mobile, address, lat, lng, sanctioned_load, image_path)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;
        const values = [username, email, passwordHash, mobile, address, lat, lng, sanctionedLoad, imagePath];
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    // -------------------------------------------------------------------------
    // READ
    // -------------------------------------------------------------------------
    static async findById(id) {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return rows[0] || null;
    }

    static async findByEmail(email) {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0] || null;
    }

    static async findByUsername(username) {
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        return rows[0] || null;
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------
    static async updateById(id, { mobile, address, lat, lng, sanctionedLoad }) {
        const query = `
      UPDATE users SET
        mobile          = COALESCE($2, mobile),
        address         = COALESCE($3, address),
        lat             = COALESCE($4, lat),
        lng             = COALESCE($5, lng),
        sanctioned_load = COALESCE($6, sanctioned_load),
        updated_at      = NOW()
      WHERE id = $1
      RETURNING *;
    `;
        const { rows } = await pool.query(query, [id, mobile, address, lat, lng, sanctionedLoad]);
        return rows[0] || null;
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------
    static async deleteById(id) {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
    }
}

module.exports = UserModel;