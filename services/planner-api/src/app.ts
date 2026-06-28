import express from 'express';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { isApiError } from './shared/apiError.js';
import { createLogger } from './shared/logging.js';

const logger = createLogger({ module: 'app' });

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (raw) return raw.split(',').map((s) => s.trim()).filter(Boolean);
  return ['http://localhost:5173', 'https://planner-chuchumbrik.amvera.io'];
}

export function createApp(): express.Application {
  const app = express();
  const origins = parseCorsOrigins();

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && origins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', createAuthRouter());

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (isApiError(err)) {
      res.status(err.status).json(err.toJSON());
      return;
    }
    logger.error('unhandled error', { err: String(err) });
    res.status(500).json({ code: 'internal_error', message: 'Internal server error' });
  });

  return app;
}
