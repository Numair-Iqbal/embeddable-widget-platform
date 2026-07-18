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

let ownerA, ownerB;
let createdWidgetId = null;

beforeAll(async () => {
  ownerA = await registerAndLogin('widgetowner_a');
  ownerB = await registerAndLogin('widgetowner_b');
});

describe('Widgets: create', () => {
  test('creates a widget for the logged-in owner', async () => {
    const res = await request(app)
      .post('/widgets')
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ type: 'popover', title: 'Test Widget', copyText: 'Hello', fields: [], targeting: {} });

    expect(res.statusCode).toBe(201);
    expect(res.body.widget.title).toBe('Test Widget');
    createdWidgetId = res.body.widget.id;
  });

  test('rejects an invalid widget type', async () => {
    const res = await request(app)
      .post('/widgets')
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ type: 'not_a_real_type', title: 'Bad Widget' });

    expect(res.statusCode).toBe(400);
  });

  test('rejects a widget with no title', async () => {
    const res = await request(app)
      .post('/widgets')
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ type: 'popover', title: '' });

    expect(res.statusCode).toBe(400);
  });
});

describe('Widgets: read', () => {
  test('owner can list their own widgets', async () => {
    const res = await request(app)
      .get('/widgets')
      .set('Authorization', `Bearer ${ownerA.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.widgets.some(w => w.id === createdWidgetId)).toBe(true);
  });

  test('owner can get a single widget by id', async () => {
    const res = await request(app)
      .get(`/widgets/${createdWidgetId}`)
      .set('Authorization', `Bearer ${ownerA.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.widget.id).toBe(createdWidgetId);
  });
});

describe('Widgets: owner isolation (security-critical)', () => {
  test('a different owner CANNOT view owner A widget by id', async () => {
    const res = await request(app)
      .get(`/widgets/${createdWidgetId}`)
      .set('Authorization', `Bearer ${ownerB.token}`);

    expect(res.statusCode).toBe(404);
  });

  test('a different owner CANNOT update owner A widget', async () => {
    const res = await request(app)
      .put(`/widgets/${createdWidgetId}`)
      .set('Authorization', `Bearer ${ownerB.token}`)
      .send({ type: 'popover', title: 'Hijacked Title', fields: [], targeting: {}, isActive: true });

    expect(res.statusCode).toBe(404);
  });

  test('a different owner CANNOT delete owner A widget', async () => {
    const res = await request(app)
      .delete(`/widgets/${createdWidgetId}`)
      .set('Authorization', `Bearer ${ownerB.token}`);

    expect(res.statusCode).toBe(404);
  });

  test('owner B never sees owner A widget in their own list', async () => {
    const res = await request(app)
      .get('/widgets')
      .set('Authorization', `Bearer ${ownerB.token}`);

    expect(res.body.widgets.some(w => w.id === createdWidgetId)).toBe(false);
  });
});

describe('Widgets: update and delete (by the correct owner)', () => {
  test('owner A can update their own widget', async () => {
    const res = await request(app)
      .put(`/widgets/${createdWidgetId}`)
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ type: 'popover', title: 'Updated Title', copyText: 'Updated', fields: [], targeting: {}, isActive: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.widget.title).toBe('Updated Title');
    expect(res.body.widget.is_active).toBe(false);
  });

  test('owner A can delete their own widget', async () => {
    const res = await request(app)
      .delete(`/widgets/${createdWidgetId}`)
      .set('Authorization', `Bearer ${ownerA.token}`);

    expect(res.statusCode).toBe(200);
  });

  test('deleted widget no longer appears for owner A', async () => {
    const res = await request(app)
      .get(`/widgets/${createdWidgetId}`)
      .set('Authorization', `Bearer ${ownerA.token}`);

    expect(res.statusCode).toBe(404);
  });
});

afterAll(async () => {
  await pool.query('DELETE FROM owners WHERE id = ANY($1)', [[ownerA.ownerId, ownerB.ownerId]]);
  await pool.end();
});