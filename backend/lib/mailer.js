import dotenv from 'dotenv';

dotenv.config();

export async function sendPasswordResetEmail({ email, nombre, resetUrl }) {
  const mode = process.env.MAIL_MODE || 'console';

  if (mode === 'console') {
    console.log('=== PASSWORD RESET EMAIL ===');
    console.log(`Para: ${nombre} <${email}>`);
    console.log(`Enlace: ${resetUrl}`);
    console.log('============================');
    return { delivered: true, previewUrl: resetUrl };
  }

  throw new Error('MAIL_MODE no soportado. Usa MAIL_MODE=console o integra un proveedor SMTP.');
}
