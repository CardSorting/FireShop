/**
 * [LAYER: PLUMBING]
 * Environment-gated logging helpers for production-safe diagnostics.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';

function emit(level: LogLevel, message: string, context?: unknown) {
  // BroccoliQ Level 3: Gated logging to prevent production noise
  if (!isDevelopment && (level === 'debug' || level === 'info')) {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = `[PM-TCG:${level.toUpperCase()}] ${timestamp}`;
  
  // Serialize error objects for better visibility in production logs
  let contextualData = context;
  if (context instanceof Error) {
    contextualData = {
      message: context.message,
      stack: context.stack,
      name: context.name,
      ...(context as any),
    };
  }

  const args = contextualData === undefined ? [message] : [message, contextualData];

  switch (level) {
    case 'debug':
      console.debug(prefix, ...args);
      break;
    case 'info':
      console.info(prefix, ...args);
      break;
    case 'warn':
      console.warn(prefix, ...args);
      break;
    case 'error':
      console.error(prefix, ...args);
      break;
  }
}

export const logger = {
  debug: (message: string, context?: unknown) => emit('debug', message, context),
  info: (message: string, context?: unknown) => emit('info', message, context),
  warn: (message: string, context?: unknown) => emit('warn', message, context),
  error: (message: string, context?: unknown) => emit('error', message, context),
};