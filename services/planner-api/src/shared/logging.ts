/**
 * Structured JSON logging for planner-api.
 * Canon: .cursor/skills/api-implementation-and-logging/SKILL.md
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFields = Record<string, unknown>;

const LEVEL_ORDER: LogLevel[] = ['debug', 'info', 'warn', 'error'];

function minLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(minLevel());
}

/** Write one JSON log line to stdout/stderr (Amvera log viewer). */
export function log(level: LogLevel, fields: LogFields & { msg: string }): void {
  if (!shouldLog(level)) return;
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    ...fields,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export type LoggerContext = {
  module: string;
  requestId?: string;
};

export type Logger = {
  debug: (msg: string, extra?: LogFields) => void;
  info: (msg: string, extra?: LogFields) => void;
  warn: (msg: string, extra?: LogFields) => void;
  error: (msg: string, extra?: LogFields) => void;
  child: (extra: LogFields) => Logger;
};

export function createLogger(ctx: LoggerContext): Logger {
  const base = (): LogFields => ({
    module: ctx.module,
    ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
  });

  const write =
    (level: LogLevel) =>
    (msg: string, extra?: LogFields): void => {
      log(level, { ...base(), msg, ...extra });
    };

  return {
    debug: write('debug'),
    info: write('info'),
    warn: write('warn'),
    error: write('error'),
    child: (extra: LogFields) =>
      createLogger({
        module: ctx.module,
        requestId: typeof extra.requestId === 'string' ? extra.requestId : ctx.requestId,
      }),
  };
}
