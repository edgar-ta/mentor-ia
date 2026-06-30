import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  base: {
    service: 'mentoria-backend',
    env: process.env.NODE_ENV || 'development'
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.currentPassword',
      'body.newPassword',
      'body.token',
      'token',
      'plainToken'
    ],
    censor: '[REDACTED]'
  },
  formatters: {
    level(label) {
      return { level: label };
    }
  }
});

export function buildRequestLog(req) {
  if (!req) return undefined;

  return {
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip,
    userId: req.user?.id || null,
    role: req.user?.rol || null,
    headers: {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    }
  };
}

export function logError(error, message, req, extra = {}) {
  logger.error(
    {
      err: error,
      req: buildRequestLog(req),
      ...extra
    },
    message
  );
}
