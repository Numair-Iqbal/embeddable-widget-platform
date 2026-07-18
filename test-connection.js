const pool = require('./src/config/db');

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🎉 Connection successful! Server time:', result.rows[0].now);
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();