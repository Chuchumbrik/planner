import { beforeEach, describe, expect, it } from 'vitest';
import { clearStoredTokens, readStoredTokens, storeTokens } from './authStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('authStorage', () => {
  it('stores and reads tokens', () => {
    storeTokens('access', 'refresh');
    expect(readStoredTokens()).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  });

  it('clearStoredTokens removes both keys', () => {
    storeTokens('a', 'r');
    clearStoredTokens();
    expect(readStoredTokens()).toEqual({ accessToken: null, refreshToken: null });
  });
});
