const request = require('supertest');
const app = require('../server');
const pool = require('../config/db');

async function registerAndLogin(prefix) {
  const email = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'TestPass123!';
  const registerRes = await request(app).post('/auth/register').send({ email, password });
  const ownerId = registerRes.body.owner.id;
  const loginRes = await request(app).post('/auth/login').send({ email, password });
  return { ownerId, token: loginRes.body.token };
}

let ownerC, widgetId;
let validSubmissionId = null;

beforeAll(async () => {
  ownerC = await registerAndLogin('subowner_c');
  const widgetRes = await request(app)
    .post('/widgets')
    .set('Authorization', `Bearer ${ownerC.token}`)
    .send({ type: 'signup_form', title: 'Submission Test Widget', fields: [], targeting: {} });
  widgetId = widgetRes.body.widget.id;
}, 30000);

// NOTE: the public POST endpoint below is rate-limited to 5 requests per
// IP per 15-minute window. Since express-rate-limit keys by IP (not by
// widget id), every POST to this endpoint across this file shares the same
// counter. The rate-limit test below doesn't assume an exact call number —
// it just sends requests until it observes a 429.

describe('Public submission endpoint: validation (requests #1-3)', () => {
  test('rejects a submission with the honeypot field filled in', async () => {
    const res = await request(app)
      .post(`/widgets/${widgetId}/submissions`)
      .send({ email: 'bot@example.com', website: 'http://spammy-bot.example' });

    expect(res.statusCode).toBe(400);
  });

  test('rejects an empty submission body', async () => {
    const res = await request(app)
      .post(`/widgets/${widgetId}/submissions`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test('rejects an oversized payload', async () => {
    const bigValue = 'x'.repeat(6000);
    const res = await request(app)
      .post(`/widgets/${widgetId}/submissions`)
      .send({ note: bigValue });

    expect(res.statusCode).toBe(400);
  });
});

describe('Public submission endpoint: valid create (request #4)', () => {
  test('creates a submission with valid data', async () => {
    const res = await request(app)
      .post(`/widgets/${widgetId}/submissions`)
      .send({ email: 'validvisitor@example.com' });

    expect(res.statusCode).toBe(201);
    expect(res.body.submission.id).toBeDefined();
    validSubmissionId = res.body.submission.id;
  });

  test('rejects a submission to a widget id that does not exist', async () => {
    const res = await request(app)
      .post('/widgets/999999999/submissions')
      .send({ email: 'nobody@example.com' });

    expect(res.statusCode).toBe(404);
  });
});

describe('Public submission endpoint: rate limiting', () => {
  test('rate limiter eventually blocks further requests with 429 once the per-IP limit is reached', async () => {
    // Earlier tests in this file already used up some of the shared per-IP
    // limit (express-rate-limit keys by IP, not by widget id), so we don't
    // assume this is exactly the "5th" or "6th" call — we just keep sending
    // requests until we see a 429, proving the limiter is active.
    let blockedResponse = null;
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post(`/widgets/${widgetId}/submissions`)
        .send({ email: `ratelimit_test_${i}@example.com` });
      if (res.statusCode === 429) {
        blockedResponse = res;
        break;
      }
    }
    expect(blockedResponse).not.toBeNull();
    expect(blockedResponse.statusCode).toBe(429);
  });
});

describe('Owner-authenticated submission management', () => {
  test('rejects listing submissions with no token', async () => {
    const res = await request(app).get(`/widgets/${widgetId}/submissions`);
    expect(res.statusCode).toBe(401);
  });

  test('owner can list submissions for their own widget', async () => {
    const res = await request(app)
      .get(`/widgets/${widgetId}/submissions`)
      .set('Authorization', `Bearer ${ownerC.token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.submissions)).toBe(true);
    expect(res.body.submissions.some(s => s.id === validSubmissionId)).toBe(true);
  });

  test('owner can edit a submission\'s data', async () => {
    const res = await request(app)
      .patch(`/widgets/${widgetId}/submissions/${validSubmissionId}`)
      .set('Authorization', `Bearer ${ownerC.token}`)
      .send({ email: 'updatedvisitor@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.submission.data.email).toBe('updatedvisitor@example.com');
  });

  test('a different owner CANNOT edit this submission', async () => {
    const ownerD = await registerAndLogin('subowner_d');
    const res = await request(app)
      .patch(`/widgets/${widgetId}/submissions/${validSubmissionId}`)
      .set('Authorization', `Bearer ${ownerD.token}`)
      .send({ email: 'hijacked@example.com' });

    expect(res.statusCode).toBe(404);
    await pool.query('DELETE FROM owners WHERE id = $1', [ownerD.ownerId]);
  });

  test('a different owner CANNOT delete this submission', async () => {
    const ownerE = await registerAndLogin('subowner_e');
    const res = await request(app)
      .delete(`/widgets/${widgetId}/submissions/${validSubmissionId}`)
      .set('Authorization', `Bearer ${ownerE.token}`);

    expect(res.statusCode).toBe(404);
    await pool.query('DELETE FROM owners WHERE id = $1', [ownerE.ownerId]);
  });

  test('owner can delete their own submission', async () => {
    const res = await request(app)
      .delete(`/widgets/${widgetId}/submissions/${validSubmissionId}`)
      .set('Authorization', `Bearer ${ownerC.token}`);

    expect(res.statusCode).toBe(200);
  });
});

// Clean up: removing ownerC cascades to their widget and any remaining submissions
afterAll(async () => {
  await pool.query('DELETE FROM owners WHERE id = $1', [ownerC.ownerId]);
  await pool.end();
}, 30000);