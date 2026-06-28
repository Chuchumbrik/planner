import { describe, expect, it } from 'vitest';
import { toPublicUser, type ApiUser } from './auth.types.js';

describe('toPublicUser', () => {
  it('maps ApiUser fields to public shape', () => {
    const row: ApiUser = {
      id: 'u1',
      email: 'a@b.c',
      motivator_role: 'admin',
      plan_tier: 'free',
      vault_encryption_enabled: true,
    };
    expect(toPublicUser(row)).toEqual(row);
  });
});
