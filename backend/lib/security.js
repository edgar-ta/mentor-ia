import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${Buffer.from(derivedKey).toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  const [salt, key] = String(storedHash || '').split(':');
  if (!salt || !key) return false;
  const derivedKey = await scryptAsync(password, salt, 64);
  const storedBuffer = Buffer.from(key, 'hex');
  const derivedBuffer = Buffer.from(derivedKey);

  if (storedBuffer.length !== derivedBuffer.length) return false;

  return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
}

export function generateOpaqueToken(size = 48) {
  return crypto.randomBytes(size).toString('base64url');
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
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
