// src/controllers/passwordReset.controller.js
// Handles forgot password and reset password for both vendors and users

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Resend } = require('resend');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

const resend = new Resend(process.env.RESEND_API_KEY);



// ---------------------------------------------------------------------------
// Helper — generate a secure random token
// ---------------------------------------------------------------------------
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

// ---------------------------------------------------------------------------
// Helper — send reset email
// ---------------------------------------------------------------------------
const sendResetEmail = async ({ to, name, resetUrl, role }) => {
    await resend.emails.send({
        from: `Kins <${process.env.RESEND_FROM_EMAIL}>`,
        to,
        subject: 'Reset your SolarSight password',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your <strong>${role}</strong> account password.</p>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background: #086d23; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p>If you didn't request this, ignore this email — your password won't change.</p>
        <p style="color: #888; font-size: 12px;">This link expires in 1 hour.</p>
      </div>
    `,
    });
};

// ---------------------------------------------------------------------------
// POST /auth/forgot-password
// Body: { email, role }  — role is 'vendor' or 'user'
// ---------------------------------------------------------------------------
const forgotPassword = async (req, res, next) => {
    try {
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ error: 'email and role are required' });
        }

        if (!['vendor', 'user'].includes(role)) {
            return res.status(400).json({ error: "role must be 'vendor' or 'user'" });
        }

        const table = role === 'vendor' ? 'vendors' : 'users';
        const nameCol = role === 'vendor' ? 'company_name' : 'username';

        // Find account — always return success to prevent email enumeration
        const { rows } = await pool.query(
            `SELECT id, email, ${nameCol} as name FROM ${table} WHERE email = $1`,
            [email.toLowerCase().trim()]
        );

        if (rows.length === 0) {
            // Return success even if email not found — security best practice
            return res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
        }

        const account = rows[0];
        const token = generateResetToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store token in DB
        await pool.query(
            `INSERT INTO password_reset_tokens (email, role, token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, role) DO UPDATE
       SET token = $3, expires_at = $4, used = FALSE, created_at = NOW()`,
            [email.toLowerCase().trim(), role, token, expiresAt]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&role=${role}`;

        await sendResetEmail({
            to: account.email,
            name: account.name,
            resetUrl,
            role,
        });

        logger.info(`Password reset email sent to ${email} (${role})`);

        return res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
    } catch (err) {
        logger.error('Forgot password error', err);
        next(err);
    }
};

// ---------------------------------------------------------------------------
// POST /auth/reset-password
// Body: { token, role, newPassword }
// ---------------------------------------------------------------------------
const resetPassword = async (req, res, next) => {
    try {
        const { token, role, newPassword } = req.body;

        if (!token || !role || !newPassword) {
            return res.status(400).json({ error: 'token, role, and newPassword are required' });
        }

        if (!['vendor', 'user'].includes(role)) {
            return res.status(400).json({ error: "role must be 'vendor' or 'user'" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Find valid token
        const { rows } = await pool.query(
            `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND role = $2 AND used = FALSE AND expires_at > NOW()`,
            [token, role]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const resetRecord = rows[0];
        const table = role === 'vendor' ? 'vendors' : 'users';

        // Update password
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await pool.query(
            `UPDATE ${table} SET password_hash = $1, updated_at = NOW() WHERE email = $2`,
            [passwordHash, resetRecord.email]
        );

        // Mark token as used
        await pool.query(
            `UPDATE password_reset_tokens SET used = TRUE WHERE token = $1`,
            [token]
        );

        logger.info(`Password reset successful for ${resetRecord.email} (${role})`);

        return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        logger.error('Reset password error', err);
        next(err);
    }
};

module.exports = { forgotPassword, resetPassword };