import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';

describe('auth routes', () => {
  it('POST /api/auth/login returns 503 when DATABASE_URL is missing', async () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const app = createApp();
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.c', password: 'x' });
    if (prev) process.env.DATABASE_URL = prev;
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('service_unavailable');
  });
});
