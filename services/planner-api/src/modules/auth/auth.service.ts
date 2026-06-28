import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type pg from 'pg';
import { apiError } from '../../shared/apiError.js';
import type { ApiUser, AuthPublicUser, AuthTokens } from './auth.types.js';
import { toPublicUser } from './auth.types.js';

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) throw apiError(503, 'service_unavailable', 'JWT_SECRET is not configured');
  return secret;
}

function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(user: ApiUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      motivator_role: user.motivator_role,
      plan_tier: user.plan_tier,
      vault_encryption_enabled: user.vault_encryption_enabled,
    },
    jwtSecret(),
    { expiresIn: ACCESS_TTL_SEC },
  );
}

export function verifyAccessToken(token: string): AuthPublicUser {
  try {
    const payload = jwt.verify(token, jwtSecret()) as jwt.JwtPayload;
    const sub = payload.sub;
    if (typeof sub !== 'string' || !sub) throw new Error('invalid sub');
    return {
      id: sub,
      email: String(payload.email ?? ''),
      motivator_role: String(payload.motivator_role ?? 'user'),
      plan_tier: String(payload.plan_tier ?? 'free'),
      vault_encryption_enabled: Boolean(payload.vault_encryption_enabled),
    };
  } catch {
    throw apiError(401, 'invalid_token', 'Invalid or expired access token');
  }
}

async function insertRefreshToken(client: pg.PoolClient, userId: string, refreshToken: string): Promise<void> {
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);
  await client.query(
    `INSERT INTO auth.refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hashRefreshToken(refreshToken), expiresAt.toISOString()],
  );
}

function issueTokens(user: ApiUser): AuthTokens {
  const accessToken = signAccessToken(user);
  const refreshToken = crypto.randomBytes(32).toString('base64url');
  return { accessToken, refreshToken, expiresInSec: ACCESS_TTL_SEC };
}

export async function registerUser(
  pool: pg.Pool,
  email: string,
  password: string,
): Promise<{ user: AuthPublicUser; tokens: AuthTokens }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password || password.length < 8) {
    throw apiError(400, 'invalid_body', 'Email and password (min 8 chars) required');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<ApiUser>(
      `INSERT INTO auth.users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, motivator_role, plan_tier, vault_encryption_enabled`,
      [normalized, passwordHash],
    );
    const user = rows[0];
    if (!user) throw apiError(500, 'internal_error', 'Registration failed');

    const tokens = issueTokens(user);
    await insertRefreshToken(client, user.id, tokens.refreshToken);
    await client.query('COMMIT');
    return { user: toPublicUser(user), tokens };
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
      throw apiError(409, 'email_taken', 'Email already registered');
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function loginUser(
  pool: pg.Pool,
  email: string,
  password: string,
): Promise<{ user: AuthPublicUser; tokens: AuthTokens }> {
  const normalized = email.trim().toLowerCase();
  const { rows } = await pool.query<ApiUser & { password_hash: string }>(
    `SELECT id, email, password_hash, motivator_role, plan_tier, vault_encryption_enabled
     FROM auth.users WHERE email = $1`,
    [normalized],
  );
  const row = rows[0];
  if (!row) throw apiError(401, 'invalid_credentials', 'Invalid email or password');

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw apiError(401, 'invalid_credentials', 'Invalid email or password');

  const user: ApiUser = {
    id: row.id,
    email: row.email,
    motivator_role: row.motivator_role,
    plan_tier: row.plan_tier,
    vault_encryption_enabled: row.vault_encryption_enabled,
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tokens = issueTokens(user);
    await insertRefreshToken(client, user.id, tokens.refreshToken);
    await client.query('COMMIT');
    return { user: toPublicUser(user), tokens };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function refreshSession(
  pool: pg.Pool,
  refreshToken: string,
): Promise<{ user: AuthPublicUser; tokens: AuthTokens }> {
  if (!refreshToken.trim()) throw apiError(400, 'invalid_body', 'refreshToken required');

  const tokenHash = hashRefreshToken(refreshToken);
  const { rows } = await pool.query<ApiUser & { rt_id: string }>(
    `SELECT u.id, u.email, u.motivator_role, u.plan_tier, u.vault_encryption_enabled, rt.id AS rt_id
     FROM auth.refresh_tokens rt
     JOIN auth.users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.expires_at > now()`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) throw apiError(401, 'invalid_token', 'Invalid or expired refresh token');

  const user: ApiUser = {
    id: row.id,
    email: row.email,
    motivator_role: row.motivator_role,
    plan_tier: row.plan_tier,
    vault_encryption_enabled: row.vault_encryption_enabled,
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM auth.refresh_tokens WHERE id = $1', [row.rt_id]);
    const tokens = issueTokens(user);
    await insertRefreshToken(client, user.id, tokens.refreshToken);
    await client.query('COMMIT');
    return { user: toPublicUser(user), tokens };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function logoutUser(pool: pg.Pool, refreshToken: string): Promise<void> {
  if (!refreshToken.trim()) return;
  await pool.query('DELETE FROM auth.refresh_tokens WHERE token_hash = $1', [hashRefreshToken(refreshToken)]);
}

export async function getUserById(pool: pg.Pool, userId: string): Promise<AuthPublicUser | null> {
  const { rows } = await pool.query<ApiUser>(
    `SELECT id, email, motivator_role, plan_tier, vault_encryption_enabled FROM auth.users WHERE id = $1`,
    [userId],
  );
  return rows[0] ? toPublicUser(rows[0]) : null;
}
