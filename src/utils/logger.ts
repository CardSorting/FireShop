/**
 * [LAYER: PLUMBING]
 * Environment-gated logging helpers for production-safe diagnostics.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'email', 'card', 'cvv', 'stripe'];

function maskSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveFields);

  const masked: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
      masked[key] = '[MASKED]';
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveFields(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function emit(level: LogLevel, message: string, context?: unknown) {
  // BroccoliQ Level 3: Gated logging to prevent production noise
  if (!isDevelopment && (level === 'debug' || level === 'info')) {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = `[DB-ART:${level.toUpperCase()}] ${timestamp}`;
  
  // Serialize error objects and mask PII
  let contextualData = context;
  if (context instanceof Error) {
    contextualData = {
      message: context.message,
      stack: context.stack,
      name: context.name,
      ...(context as any),
    };
  }
  
  contextualData = maskSensitiveFields(contextualData);

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