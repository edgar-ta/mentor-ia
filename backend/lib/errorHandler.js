import { logError } from './logger.js';

const isProduction = process.env.NODE_ENV === 'production';
const DEFAULT_ERROR_MESSAGE = 'Ocurrio un error inesperado. Intenta nuevamente mas tarde.';

function normalizeStatus(statusCode) {
  return Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
}

export function sendSafeError(res, error, options = {}) {
  const statusCode = normalizeStatus(options.statusCode || error?.statusCode || error?.status);
  const fallbackMessage = options.message || DEFAULT_ERROR_MESSAGE;
  const payload = {
    message: isProduction ? fallbackMessage : error?.message || fallbackMessage
  };

  if (!isProduction && error?.stack) {
    payload.stack = error.stack;
  }

  return res.status(statusCode).json(payload);
}

export function handleRouteError(req, res, error, options = {}) {
  logError(error, options.logMessage || 'Error manejado en ruta', req, {
    statusCode: options.statusCode || error?.statusCode || error?.status,
    body: req.body
  });

  return sendSafeError(res, error, options);
}

export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Recurso no encontrado.' });
}

export function errorHandler(error, req, res, next) {
  logError(error, 'Error no controlado por middleware global', req, {
    statusCode: error?.statusCode || error?.status,
    body: req.body
  });

  if (res.headersSent) {
    return next(error);
  }

  return sendSafeError(res, error);
}
