import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { authService } from '../src/services/auth.service.js';
import { generateToken } from '../src/utils/jwt.js';

describe('Authentication & User Model Unit/Integration Tests', () => {
  describe('User Model Methods', () => {
    it('creates and verifies password reset token', () => {
      const user = new User({
        name: 'Reset Test',
        email: 'reset@example.com',
        password: 'Password123!',
      });

      const token = user.createPasswordResetToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
      expect(user.passwordResetExpires!.getTime()).toBeGreaterThan(Date.now());
    });

    it('creates and verifies email verification token', () => {
      const user = new User({
        name: 'Verify Test',
        email: 'verify@example.com',
        password: 'Password123!',
      });

      const token = user.createEmailVerificationToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(user.emailVerificationToken).toBeDefined();
      expect(user.emailVerificationExpires).toBeDefined();
      expect(user.emailVerificationExpires!.getTime()).toBeGreaterThan(Date.now());
    });

    it('generates valid JWT with user payload', () => {
      const user = new User({
        name: 'JWT Test',
        email: 'jwt@example.com',
        password: 'Password123!',
        role: 'USER',
      });

      const token = generateToken(user);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('Validation & Auth Endpoints', () => {
    it('POST /api/v1/auth/register fails on invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'valid@example.com',
          password: 'short', // Too short and missing requirements
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/auth/register fails on invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'ValidPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/auth/login fails when body is incomplete', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/auth/me returns 401 when no token is present', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/users/me returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /api/v1/auth/logout succeeds and clears cookie', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('token=;');
    });

    it('POST /api/v1/auth/register delegates to authService and returns 201 with cookie', async () => {
      const mockUser = new User({
        name: 'Mock Alice',
        email: 'alice@example.com',
        role: 'USER',
        addresses: [],
        isActive: true,
        emailVerified: false,
      });

      const spy = vi.spyOn(authService, 'register').mockResolvedValueOnce({
        user: mockUser,
        token: 'mock-jwt-token-xyz',
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Mock Alice',
          email: 'alice@example.com',
          password: 'StrongPassword123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('token=mock-jwt-token-xyz');

      spy.mockRestore();
    });

    it('POST /api/v1/auth/login delegates to authService and sets cookie', async () => {
      const mockUser = new User({
        name: 'Mock Bob',
        email: 'bob@example.com',
        role: 'USER',
        addresses: [],
        isActive: true,
        emailVerified: false,
      });

      const spy = vi.spyOn(authService, 'login').mockResolvedValueOnce({
        user: mockUser,
        token: 'mock-jwt-token-bob',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'bob@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('bob@example.com');
      expect(res.headers['set-cookie'][0]).toContain('token=mock-jwt-token-bob');

      spy.mockRestore();
    });
  });
});
