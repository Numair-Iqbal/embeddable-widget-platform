const pool = require('../config/db');

// Find an owner by email (used during login and duplicate-check)
async function findByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM owners WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

// Create a new owner (used during registration)
async function create(email, passwordHash) {
  const result = await pool.query(
    'INSERT INTO owners (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );
  return result.rows[0];
}

module.exports = { findByEmail, create };