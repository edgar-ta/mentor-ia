import { clearSessionCookie } from './http.js';
import { getCurrentSession } from './auth.js';
import { handleRouteError } from './errorHandler.js';

export async function requireLogin(req, res, next) {
  try {
    const current = await getCurrentSession(req);
    if (!current) {
      clearSessionCookie(res);
      return res.status(401).json({ message: 'Debes iniciar sesion para continuar.' });
    }

    req.user = {
      id: current.id,
      nombre: current.nombre,
      email: current.email,
      rol: current.rol
    };
    req.sessionInfo = current.session;
    next();
  } catch (error) {
    handleRouteError(req, res, error, {
      statusCode: 500,
      message: 'No se pudo validar la sesion.',
      logMessage: 'Error en requireLogin'
    });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Debes iniciar sesion.' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso.' });
    }

    next();
  };
}
