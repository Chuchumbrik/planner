import { describe, expect, it, vi } from 'vitest';
import { ApiClientError, apiFetch } from './client';

describe('apiFetch', () => {
  it('throws when VITE_API_URL is not configured', async () => {
    vi.stubEnv('VITE_API_URL', '');
    await expect(apiFetch('/health')).rejects.toThrow('VITE_API_URL is not configured');
    vi.unstubAllEnvs();
  });
});

describe('ApiClientError', () => {
  it('exposes status and code from body', () => {
    const err = new ApiClientError(401, { code: 'invalid_credentials', message: 'Bad login' });
    expect(err.status).toBe(401);
    expect(err.code).toBe('invalid_credentials');
    expect(err.message).toBe('Bad login');
  });
});
