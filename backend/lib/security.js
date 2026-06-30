import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getRequiredEnv } from './env.js';

const BCRYPT_COST = Number.parseInt(process.env.BCRYPT_COST || '12', 10);
const JWT_TTL_SECONDS = Number.parseInt(process.env.JWT_TTL_SECONDS || '900', 10);
const JWT_ISSUER = process.env.JWT_ISSUER || 'mentoria-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'mentoria-web';

function getJwtSecret() {
  const secret = getRequiredEnv('JWT_SECRET');
  if (secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
  }
  return secret;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password, storedHash) {
  const hash = String(storedHash || '');
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$')) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export function generateOpaqueToken(size = 48) {
  return crypto.randomBytes(size).toString('base64url');
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function createSessionJwt({ userId, role, sessionId, jti }) {
  return jwt.sign(
    {
      sub: String(userId),
      sid: String(sessionId),
      rol: role,
      jti
    },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      expiresIn: JWT_TTL_SECONDS,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }
  );
}

export function verifySessionJwt(token, { ignoreExpiration = false } = {}) {
  const payload = jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    ignoreExpiration
  });

  if (!payload?.sub || !payload?.sid || !payload?.jti || !payload?.rol) {
    throw new Error('JWT de sesion incompleto.');
  }

  return {
    userId: Number(payload.sub),
    sessionId: Number(payload.sid),
    role: payload.rol,
    jti: payload.jti
  };
}

export function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 10 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}
