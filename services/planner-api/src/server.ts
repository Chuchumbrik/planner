import { createApp } from './app.js';
import { log } from './shared/logging.js';

export function startServer(): void {
  const port = Number(process.env.PORT ?? 8080);
  const host = process.env.HOST ?? '0.0.0.0';
  const app = createApp();
  app.listen(port, host, () => {
    log('info', { msg: 'planner-api listening', port, host, module: 'server' });
  });
}

if (process.env.VITEST !== 'true') {
  startServer();
}
