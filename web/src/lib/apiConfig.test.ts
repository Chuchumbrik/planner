import { afterEach, describe, expect, it, vi } from 'vitest';
import { getApiBaseUrl, isApiConfigured } from './apiConfig';

describe('apiConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('strips trailing slashes from VITE_API_URL', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/');
    expect(getApiBaseUrl()).toBe('https://api.example.com');
    expect(isApiConfigured()).toBe(true);
  });

  it('isApiConfigured is false when env is empty', () => {
    vi.stubEnv('VITE_API_URL', '');
    expect(isApiConfigured()).toBe(false);
  });
});
