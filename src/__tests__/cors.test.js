const request = require('supertest');
const app = require('../server');
const pool = require('../config/db');

// These must match the allowedOrigins array in src/server.js
const ALLOWED_ORIGIN = 'http://localhost:3000';
const DISALLOWED_ORIGIN = 'http://evil-attacker-site.example';

describe('CORS: preflight handling on the public submission endpoint', () => {
  test('an allowed origin receives a successful preflight response with matching CORS header', async () => {
    const res = await request(app)
      .options('/widgets/1/submissions')
      .set('Origin', ALLOWED_ORIGIN)
      .set('Access-Control-Request-Method', 'POST');

    // The cors middleware auto-responds to OPTIONS with 204 when the origin is allowed
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });

  test('a disallowed origin does NOT get a matching Access-Control-Allow-Origin header', async () => {
    const res = await request(app)
      .options('/widgets/1/submissions')
      .set('Origin', DISALLOWED_ORIGIN)
      .set('Access-Control-Request-Method', 'POST');

    // Whatever status Express returns for the CORS error, the important
    // security property is that the disallowed origin is never echoed
    // back as an allowed origin.
    expect(res.headers['access-control-allow-origin']).not.toBe(DISALLOWED_ORIGIN);
  });

  test('a request with no Origin header (e.g. server-to-server or same-origin) is allowed through', async () => {
    // server.js explicitly allows requests with no origin at all
    const res = await request(app)
      .options('/widgets/1/submissions')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.statusCode).toBe(204);
  });
});

afterAll(async () => {
  await pool.end();
});