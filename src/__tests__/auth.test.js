const request = require('supertest');
const app = require('../server');
const pool = require('../config/db');

const testEmail = `authtest_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
const testPassword = 'TestPass123!';
let createdOwnerId = null;

describe('Auth: register', () => {
  test('registers a new owner successfully', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.statusCode).toBe(201);
    expect(res.body.owner).toBeDefined();
    expect(res.body.owner.email).toBe(testEmail);
    createdOwnerId = res.body.owner.id;
  });

  test('rejects duplicate email registration', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.statusCode).toBe(400);
  });

  test('rejects registration with missing password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: `incomplete_${Date.now()}@example.com` });

    expect(res.statusCode).toBe(400);
  });
});

describe('Auth: login', () => {
  test('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.owner.email).toBe(testEmail);
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: 'WrongPassword!' });

    expect(res.statusCode).toBe(401);
  });

  test('rejects login for an email that does not exist', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'doesnotexist_xyz@example.com', password: 'whatever' });

    expect(res.statusCode).toBe(401);
  });
});

describe('Auth: protected route access', () => {
  test('rejects requests with no token', async () => {
    const res = await request(app).get('/widgets');
    expect(res.statusCode).toBe(401);
  });

  test('rejects requests with an invalid/garbage token', async () => {
    const res = await request(app)
      .get('/widgets')
      .set('Authorization', 'Bearer this.is.not.a.valid.token');

    expect(res.statusCode).toBe(401);
  });

  test('accepts requests with a valid token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    const res = await request(app)
      .get('/widgets')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.widgets)).toBe(true);
  });
});

afterAll(async () => {
  if (createdOwnerId) {
    await pool.query('DELETE FROM owners WHERE id = $1', [createdOwnerId]);
  }
  await pool.end();
});