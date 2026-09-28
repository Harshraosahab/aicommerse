import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { interactionService } from '../src/services/interaction.service.js';
import { generateToken } from '../src/utils/jwt.js';
import { User } from '../src/models/user.model.js';

describe('Phase 8: User Interactions Tracking Tests', () => {
  const validProductId = '507f1f77bcf86cd799439011';
  const validUserId = '507f1f77bcf86cd799439012';

  it('rejects interaction tracking if action is missing or invalid', async () => {
    const res = await request(app)
      .post('/api/v1/interactions')
      .send({
        action: 'INVALID_ACTION',
        sessionToken: 'test-session-123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects interaction tracking if productId is malformed', async () => {
    const res = await request(app)
      .post('/api/v1/interactions')
      .send({
        action: 'VIEW',
        productId: 'not-a-valid-object-id',
        sessionToken: 'test-session-123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('records interaction for guest user with sessionToken', async () => {
    const spy = vi.spyOn(interactionService, 'recordInteraction').mockResolvedValueOnce({
      _id: 'int-123' as any,
      sessionToken: 'test-session-123',
      product: validProductId as any,
      action: 'VIEW',
      metadata: { source: 'recommendations' },
      timestamp: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/v1/interactions')
      .send({
        action: 'VIEW',
        productId: validProductId,
        sessionToken: 'test-session-123',
        metadata: { source: 'recommendations' },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.action).toBe('VIEW');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionToken: 'test-session-123',
        action: 'VIEW',
      })
    );

    spy.mockRestore();
  });

  it('records interaction for authenticated user extracting user ID from JWT', async () => {
    const token = generateToken({
      _id: validUserId as any,
      email: 'user@example.com',
      role: 'customer',
    } as any);

    const userSpy = vi.spyOn(User, 'findById').mockResolvedValueOnce({
      _id: validUserId,
      email: 'user@example.com',
      role: 'customer',
      isActive: true,
    } as any);

    const spy = vi.spyOn(interactionService, 'recordInteraction').mockResolvedValueOnce({
      _id: 'int-auth-1' as any,
      user: validUserId as any,
      product: validProductId as any,
      action: 'ADD_TO_CART',
      metadata: { source: 'product_detail' },
      timestamp: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/v1/interactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        action: 'ADD_TO_CART',
        productId: validProductId,
        metadata: { source: 'product_detail' },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: validUserId,
        action: 'ADD_TO_CART',
      })
    );

    userSpy.mockRestore();
    spy.mockRestore();
  });
});
