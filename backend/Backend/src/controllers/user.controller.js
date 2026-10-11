// src/controllers/user.controller.js
// Handles HTTP requests for the end-user resource.
// req.auth.payload.sub is now "user:<id>" (set by our custom jwtCheck).

const UserModel = require('../models/user.model');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sanitizeUserOutput = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    address: user.address,
    lat: user.lat,
    lng: user.lng,
    sanctionedLoad: user.sanctioned_load,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

/** Extract numeric DB id from JWT sub ("user:42" → 42) */
const extractUserId = (sub) => {
  const parts = sub?.split(':');
  if (!parts || parts[0] !== 'user' || !parts[1]) return null;
  return parseInt(parts[1], 10);
};

// ---------------------------------------------------------------------------
// GET /users/me  — returns logged-in user's profile
// ---------------------------------------------------------------------------
const getProfile = async (req, res, next) => {
  try {
    const userId = extractUserId(req.auth?.payload?.sub);
    if (!userId) return res.status(400).json({ error: 'Invalid authentication token' });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ user: sanitizeUserOutput(user) });
  } catch (err) {
    logger.error('Get profile error', err);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PUT /users/me  — update profile fields
// ---------------------------------------------------------------------------
const updateProfile = async (req, res, next) => {
  try {
    const userId = extractUserId(req.auth?.payload?.sub);
    if (!userId) return res.status(400).json({ error: 'Invalid authentication token' });

    const { mobile, address, lat, lng, sanctionedLoad } = req.body;

    const updatedUser = await UserModel.updateById(userId, {
      mobile,
      address,
      lat,
      lng,
      sanctionedLoad,
    });

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: sanitizeUserOutput(updatedUser),
    });
  } catch (err) {
    logger.error('Update profile error', err);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /users/me  — delete account
// ---------------------------------------------------------------------------
const deleteAccount = async (req, res, next) => {
  try {
    const userId = extractUserId(req.auth?.payload?.sub);
    if (!userId) return res.status(400).json({ error: 'Invalid authentication token' });

    await UserModel.deleteById(userId);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    logger.error('Delete account error', err);
    next(err);
  }
};

module.exports = { getProfile, updateProfile, deleteAccount };