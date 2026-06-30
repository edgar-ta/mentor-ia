import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nodeEnv = process.env.NODE_ENV || 'development';

dotenv.config({ path: path.join(backendRoot, `.env.${nodeEnv}`) });
dotenv.config({ path: path.join(backendRoot, '.env') });

const PLACEHOLDER_VALUES = new Set([
  '',
  'change-me',
  'replace-me',
  'your_database_password_here',
  'your_secure_admin_password_here',
  'your_strong_jwt_secret_here'
]);

export function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value || PLACEHOLDER_VALUES.has(value.trim().toLowerCase())) {
    throw new Error(`Variable de entorno requerida no configurada: ${name}`);
  }

  return value;
}
