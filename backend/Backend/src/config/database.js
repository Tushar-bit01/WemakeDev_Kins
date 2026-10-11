// This file Creates and manages the PostgreSQL connection pool

const { Pool } = require('pg');


//PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


//Verify database connection on startup
pool.on('connect', () => {
  console.log('PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('Unexpected PG error', err);
  process.exit(1);
});

module.exports = {
  pool
};
