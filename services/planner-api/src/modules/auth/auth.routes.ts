import { Router, type Request, type Response, type NextFunction } from 'express';
import { createLogger } from '../../shared/logging.js';
import { getPool } from '../../shared/db/pool.js';
import {
  getUserById,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  verifyAccessToken,
} from './auth.service.js';

const log = createLogger({ module: 'auth.routes' });

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

function requirePool(res: Response): ReturnType<typeof getPool> {
  const pool = getPool();
  if (!pool) {
    res.status(503).json({ code: 'service_unavailable', message: 'DATABASE_URL is not configured' });
    return null;
  }
  return pool;
}

function tokenResponse(
  res: Response,
  user: unknown,
  tokens: { accessToken: string; refreshToken: string; expiresInSec: number },
): void {
  res.json({
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresInSec,
  });
}

export function createAuthRouter(): Router {
  const router = Router();

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const pool = requirePool(res);
      if (!pool) return;
      const email = String(req.body?.email ?? '');
      const password = String(req.body?.password ?? '');
      const result = await registerUser(pool, email, password);
      log.info('user registered', { userId: result.user.id });
      tokenResponse(res, result.user, result.tokens);
    }),
  );

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const pool = requirePool(res);
      if (!pool) return;
      const email = String(req.body?.email ?? '');
      const password = String(req.body?.password ?? '');
      const result = await loginUser(pool, email, password);
      log.info('user login', { userId: result.user.id });
      tokenResponse(res, result.user, result.tokens);
    }),
  );

  router.post(
    '/refresh',
    asyncHandler(async (req, res) => {
      const pool = requirePool(res);
      if (!pool) return;
      const refreshToken = String(req.body?.refreshToken ?? '');
      const result = await refreshSession(pool, refreshToken);
      tokenResponse(res, result.user, result.tokens);
    }),
  );

  router.post(
    '/logout',
    asyncHandler(async (req, res) => {
      const pool = requirePool(res);
      if (!pool) return;
      const refreshToken = String(req.body?.refreshToken ?? '');
      await logoutUser(pool, refreshToken);
      res.status(204).end();
    }),
  );

  router.get(
    '/me',
    asyncHandler(async (req, res) => {
      const pool = requirePool(res);
      if (!pool) return;
      const header = req.headers.authorization ?? '';
      const match = /^Bearer\s+(.+)$/i.exec(header);
      if (!match?.[1]) {
        res.status(401).json({ code: 'invalid_token', message: 'Missing bearer token' });
        return;
      }
      const claims = verifyAccessToken(match[1]);
      const user = await getUserById(pool, claims.id);
      if (!user) {
        res.status(401).json({ code: 'invalid_token', message: 'User not found' });
        return;
      }
      res.json({ user });
    }),
  );

  router.post('/request-password-reset', (_req, res) => {
    res.status(501).json({
      code: 'not_implemented',
      message: 'Password reset email — planned (SMTP in auth module)',
    });
  });

  return router;
}
