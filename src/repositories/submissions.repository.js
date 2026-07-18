const pool = require('../config/db');

async function createSubmission({ widgetId, data, ipAddress, geoCountry, geoCity, geoProviderUsed, isSpam }) {
  const result = await pool.query(
    `INSERT INTO submissions (widget_id, data, ip_address, geo_country, geo_city, geo_provider_used, is_spam)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [widgetId, JSON.stringify(data), ipAddress, geoCountry, geoCity, geoProviderUsed, isSpam]
  );
  return result.rows[0];
}

async function findByWidgetId(widgetId) {
  const result = await pool.query(
    `SELECT * FROM submissions WHERE widget_id = $1 ORDER BY created_at DESC`,
    [widgetId]
  );
  return result.rows;
}
async function countByOwnerId(ownerId) {
  const totalResult = await pool.query(
    `SELECT COUNT(*) FROM submissions s
     JOIN widgets w ON s.widget_id = w.id
     WHERE w.owner_id = $1`,
    [ownerId]
  );

  const weekResult = await pool.query(
    `SELECT COUNT(*) FROM submissions s
     JOIN widgets w ON s.widget_id = w.id
     WHERE w.owner_id = $1 AND s.created_at >= NOW() - INTERVAL '7 days'`,
    [ownerId]
  );

  return {
    totalSubmissions: parseInt(totalResult.rows[0].count, 10),
    submissionsThisWeek: parseInt(weekResult.rows[0].count, 10)
  };
}
// Update a submission's data, but ONLY if the widget belongs to this owner
async function updateSubmission(id, ownerId, data) {
  const result = await pool.query(
    `UPDATE submissions s
     SET data = $1
     FROM widgets w
     WHERE s.id = $2 AND s.widget_id = w.id AND w.owner_id = $3
     RETURNING s.*`,
    [JSON.stringify(data), id, ownerId]
  );
  return result.rows[0];
}

// Delete a submission, but ONLY if the widget belongs to this owner
async function removeSubmission(id, ownerId) {
  const result = await pool.query(
    `DELETE FROM submissions s
     USING widgets w
     WHERE s.id = $1 AND s.widget_id = w.id AND w.owner_id = $2
     RETURNING s.id`,
    [id, ownerId]
  );
  return result.rows[0];
}
module.exports = { createSubmission, findByWidgetId, countByOwnerId, updateSubmission, removeSubmission };