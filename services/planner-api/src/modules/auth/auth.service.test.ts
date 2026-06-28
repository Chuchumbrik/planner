import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signAccessToken, verifyAccessToken } from './auth.service.js';
import type { ApiUser } from './auth.types.js';

describe('auth.service tokens', () => {
  const user: ApiUser = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'test@example.com',
    motivator_role: 'admin',
    plan_tier: 'free',
    vault_encryption_enabled: false,
  };

  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'test-secret-for-vitest-only');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('signAccessToken and verifyAccessToken round-trip claims', () => {
    const token = signAccessToken(user);
    const claims = verifyAccessToken(token);
    expect(claims.id).toBe(user.id);
    expect(claims.email).toBe(user.email);
    expect(claims.motivator_role).toBe('admin');
  });

  it('verifyAccessToken rejects garbage', () => {
    expect(() => verifyAccessToken('not-a-jwt')).toThrow();
  });
});
