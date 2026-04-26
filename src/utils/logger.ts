/**
 * [LAYER: PLUMBING]
 * Environment-gated logging helpers for production-safe diagnostics.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';

function emit(level: LogLevel, message: string, context?: unknown) {
  if (!isDevelopment && (level === 'debug' || level === 'info')) {
    return;
  }

  const args = context === undefined ? [message] : [message, context];

  switch (level) {
    case 'debug':
      console.debug(...args);
      break;
    case 'info':
      console.info(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
}

export const logger = {
  debug: (message: string, context?: unknown) => emit('debug', message, context),
  info: (message: string, context?: unknown) => emit('info', message, context),
  warn: (message: string, context?: unknown) => emit('warn', message, context),
  error: (message: string, context?: unknown) => emit('error', message, context),
};