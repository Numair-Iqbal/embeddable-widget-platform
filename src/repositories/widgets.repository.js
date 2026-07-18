const pool = require('../config/db');

// Create a new widget for a given owner
async function create(ownerId, { type, title, copyText, fields, targeting }) {
  const result = await pool.query(
    `INSERT INTO widgets (owner_id, type, title, copy_text, fields, targeting)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [ownerId, type, title, copyText || '', JSON.stringify(fields || []), JSON.stringify(targeting || {})]
  );
  return result.rows[0];
}

// Get all widgets belonging to a specific owner (tenant isolation)
async function findAllByOwner(ownerId) {
  const result = await pool.query(
    'SELECT * FROM widgets WHERE owner_id = $1 ORDER BY created_at DESC',
    [ownerId]
  );
  return result.rows;
}

// Get a single widget by id, but ONLY if it belongs to this owner
async function findByIdAndOwner(id, ownerId) {
  const result = await pool.query(
    'SELECT * FROM widgets WHERE id = $1 AND owner_id = $2',
    [id, ownerId]
  );
  return result.rows[0];
}

// Get a single widget by id ONLY (used by the public config endpoint - no owner check)
async function findById(id) {
  const result = await pool.query(
    'SELECT * FROM widgets WHERE id = $1 AND is_active = true',
    [id]
  );
  return result.rows[0];
}

// Update a widget, but ONLY if it belongs to this owner
async function update(id, ownerId, { type, title, copyText, fields, targeting, isActive }) {
  const result = await pool.query(
    `UPDATE widgets
     SET type = $1, title = $2, copy_text = $3, fields = $4, targeting = $5, is_active = $6, updated_at = NOW()
     WHERE id = $7 AND owner_id = $8
     RETURNING *`,
    [type, title, copyText, JSON.stringify(fields), JSON.stringify(targeting), isActive, id, ownerId]
  );
  return result.rows[0];
}

// Delete a widget, but ONLY if it belongs to this owner
async function remove(id, ownerId) {
  const result = await pool.query(
    'DELETE FROM widgets WHERE id = $1 AND owner_id = $2 RETURNING id',
    [id, ownerId]
  );
  return result.rows[0];
}

// Count only active widgets for this owner
async function countActiveByOwnerId(ownerId) {
  const result = await pool.query(
    `SELECT COUNT(*) AS count FROM widgets WHERE owner_id = $1 AND is_active = true`,
    [ownerId]
  );
  return parseInt(result.rows[0].count, 10);
}

module.exports = { create, findAllByOwner, findByIdAndOwner, findById, update, remove, countActiveByOwnerId };