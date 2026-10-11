// src/config/jwt.js  — replaces src/config/auth0.js  (delete that file)
// Central place to read JWT config from env so it's easy to rotate

module.exports = {
  secret:    process.env.JWT_SECRET,      // long random string, min 32 chars
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  issuer:    process.env.JWT_ISSUER   || 'your-app-name',
  audience:  process.env.JWT_AUDIENCE || 'your-app-api',
  algorithm: 'HS256',
};