import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Error Handling Middleware', () => {
  it('should return 404 with structured error envelope for non-existent routes', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: 'NOT_FOUND',
        message: expect.stringContaining('Resource not found'),
      }),
    });
  });

  it('should return 404 with structured error envelope for unmapped endpoints', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: 'NOT_FOUND',
        message: expect.stringContaining('Resource not found'),
      }),
    });
  });
});

