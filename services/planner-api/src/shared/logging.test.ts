import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger, log } from './logging';

describe('logging', () => {
  beforeEach(() => {
    vi.stubEnv('LOG_LEVEL', 'debug');
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('log emits JSON with level, time, msg', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log('info', { msg: 'hello', module: 'test' });
    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(parsed.level).toBe('info');
    expect(parsed.msg).toBe('hello');
    expect(parsed.module).toBe('test');
    expect(typeof parsed.time).toBe('string');
  });

  it('createLogger includes module and requestId', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = createLogger({ module: 'notify', requestId: 'req-1' });
    logger.info('cron completed', { sentCount: 3, durationMs: 10 });
    const parsed = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(parsed.module).toBe('notify');
    expect(parsed.requestId).toBe('req-1');
    expect(parsed.sentCount).toBe(3);
    expect(parsed.durationMs).toBe(10);
  });

  it('respects LOG_LEVEL', () => {
    vi.stubEnv('LOG_LEVEL', 'error');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log('info', { msg: 'hidden' });
    expect(spy).not.toHaveBeenCalled();
  });
});
