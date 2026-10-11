//This file Runs database migrations to create or update tables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const runMigration = async () => {
  try {
    console.log('Starting database migration...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
};

runMigration();
