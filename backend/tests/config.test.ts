import { describe, it, expect } from 'vitest';
import { env } from '../src/config/env.js';

describe('Environment Configuration', () => {
  it('should validate and load default configuration values properly', () => {
    expect(env.PORT).toBeDefined();
    expect(typeof env.PORT).toBe('number');
    expect(env.NODE_ENV).toBeDefined();
    expect(['development', 'test', 'production']).toContain(env.NODE_ENV);
    expect(env.MONGODB_URI).toBeDefined();
    expect(env.AI_SERVICE_URL).toBeDefined();
  });
});
