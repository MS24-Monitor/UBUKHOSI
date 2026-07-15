import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildDashboardSummary, createCourtCase, createLandParcel, createLivestockRecord, createProject, createApp } from '../index.js';

function getToken() {
  return request(createApp())
    .post('/api/auth/login')
    .send({ email: 'super.admin@ubukhosi.gov', password: 'changeme' })
    .then((response) => response.body.token as string);
}

describe('UBUKHOSI MVP API', () => {
  it('logs in seeded users and returns roles', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'super.admin@ubukhosi.gov', password: 'changeme' });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('super_admin');
    expect(response.body.token).toBeTruthy();
  });

  it('returns a dashboard summary from seeded demo data', async () => {
    const app = createApp();
    const response = await request(app).get('/api/dashboard/summary');

    expect(response.status).toBe(200);
    expect(response.body.kingdoms).toBe(1);
    expect(response.body.landParcels).toBeGreaterThan(0);
    expect(response.body.livestock).toBeGreaterThan(0);
  });

  it('rejects invalid credentials and unauthorised access', async () => {
    const app = createApp();
    const badLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'super.admin@ubukhosi.gov', password: 'wrong' });
    const badToken = await request(app).get('/api/courts');

    expect(badLogin.status).toBe(401);
    expect(badToken.status).toBe(401);
  });

  it('returns the audit trail for authenticated users', async () => {
    const app = createApp();
    const token = await getToken();
    const response = await request(app).get('/api/audit').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('serves the GraphQL hello query', async () => {
    const { rootValue } = await import('../index.js');
    const response = await rootValue.hello();

    expect(response).toBe('UBUKHOSI MVP is live');
  });

  it('returns the investor demo landing data', async () => {
    const app = createApp();
    const response = await request(app).get('/api/investor/demo');

    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('investor');
    expect(response.body.modules.length).toBeGreaterThan(0);
  });

  it('supports the helper functions for seeded business logic', () => {
    const state = {
      users: [],
      courts: [],
      landParcels: [],
      livestock: [],
      projects: [],
      auditLog: []
    };

    createCourtCase({ title: 'Boundary Hearing', caseType: 'land', defendant: 'Mahlangu' }, state as never);
    createLandParcel({ parcelId: 'LP-900', owner: 'A. Mamba', sizeHa: 6.2 }, state as never);
    createLivestockRecord({ tag: 'LM-1001', species: 'cattle', owner: 'S. Ndlovu' }, state as never);
    createProject({ name: 'Water Harvesting', status: 'active' }, state as never);

    const summary = buildDashboardSummary(state as never);
    expect(summary.landParcels).toBeGreaterThan(0);
    expect(summary.livestock).toBeGreaterThan(0);
  });

  it('supports court CRUD operations', async () => {
    const app = createApp();
    const token = await getToken();
    const createResponse = await request(app)
      .post('/api/courts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Boundary Hearing', caseType: 'land', defendant: 'Mahlangu' });

    expect(createResponse.status).toBe(201);
    const listResponse = await request(app).get('/api/courts').set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.length).toBeGreaterThan(0);
  });

  it('supports land CRUD operations', async () => {
    const app = createApp();
    const token = await getToken();
    const createResponse = await request(app)
      .post('/api/land-parcels')
      .set('Authorization', `Bearer ${token}`)
      .send({ parcelId: 'LP-900', owner: 'A. Mamba', sizeHa: 6.2 });

    expect(createResponse.status).toBe(201);
    const listResponse = await request(app).get('/api/land-parcels').set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.length).toBeGreaterThan(0);
  });

  it('supports livestock CRUD operations', async () => {
    const app = createApp();
    const token = await getToken();
    const createResponse = await request(app)
      .post('/api/livestock')
      .set('Authorization', `Bearer ${token}`)
      .send({ tag: 'LM-1001', species: 'cattle', owner: 'S. Ndlovu' });

    expect(createResponse.status).toBe(201);
    const listResponse = await request(app).get('/api/livestock').set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.length).toBeGreaterThan(0);
  });

  it('supports community registry CRUD operations', async () => {
    const app = createApp();
    const token = await getToken();
    const createResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Water Harvesting', status: 'active' });

    expect(createResponse.status).toBe(201);
    const listResponse = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.length).toBeGreaterThan(0);
  });
});
