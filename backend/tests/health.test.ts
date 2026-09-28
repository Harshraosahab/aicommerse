import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('GET /api/v1/health', () => {
  it('should return 200 with structured health diagnostic data', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');

    const { data } = res.body;
    expect(data).toHaveProperty('api');
    expect(data).toHaveProperty('database');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('environment');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptimeSeconds');
    expect(data).toHaveProperty('system');
    expect(data.system).toHaveProperty('nodeVersion');
    expect(data.system).toHaveProperty('memoryUsageMB');
    expect(data).toHaveProperty('dependencies');
    expect(data.dependencies).toHaveProperty('database');
    expect(data.dependencies.database).toHaveProperty('status');
  });

  it('should include x-request-id header on responses', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers).toHaveProperty('x-request-id');
  });
});
