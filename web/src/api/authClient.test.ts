import { describe, expect, it } from 'vitest';
import { apiUserToSession } from './authClient';

describe('apiUserToSession', () => {
  it('builds Session with motivator_role in app_metadata', () => {
    const session = apiUserToSession(
      {
        id: 'id-1',
        email: 'u@x.com',
        motivator_role: 'beta_tester',
        plan_tier: 'free',
        vault_encryption_enabled: false,
      },
      'tok',
    );
    expect(session.access_token).toBe('tok');
    expect(session.user?.app_metadata).toEqual({ motivator_role: 'beta_tester' });
    expect(session.user?.email).toBe('u@x.com');
  });
});
