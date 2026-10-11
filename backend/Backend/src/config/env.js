// This file Loads, validates, and centralizes environment variables

const dotenv = require('dotenv');
dotenv.config();

// Required environment variables
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',

  // Custom JWT
  'JWT_SECRET',
  'JWT_ISSUER',
  'JWT_AUDIENCE',

  // Database
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
];

// Validate required environment variables
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,

  JWT_SECRET:   process.env.JWT_SECRET,
  JWT_ISSUER:   process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  DB_HOST:     process.env.DB_HOST,
  DB_PORT:     process.env.DB_PORT,
  DB_NAME:     process.env.DB_NAME,
  DB_USER:     process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
};