import { afterEach, describe, expect, it } from 'vitest';
import { closePool, getPool } from './pool.js';

describe('getPool', () => {
  afterEach(async () => {
    await closePool();
    delete process.env.DATABASE_URL;
  });

  it('returns null when DATABASE_URL is not set', () => {
    delete process.env.DATABASE_URL;
    expect(getPool()).toBeNull();
  });
});
