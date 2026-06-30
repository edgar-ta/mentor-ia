import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

export async function sendPasswordResetEmail({ email, nombre, resetUrl }) {
  const mode = process.env.MAIL_MODE || 'console';

  if (mode === 'console') {
    logger.info({ email, nombre, mode, previewAvailable: true }, 'Password reset email generado');
    return { delivered: true, previewUrl: resetUrl };
  }

  throw new Error('MAIL_MODE no soportado. Usa MAIL_MODE=console o integra un proveedor SMTP.');
}
