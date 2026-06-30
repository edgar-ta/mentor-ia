import { z } from 'zod';

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SCRIPT_OR_STYLE_BLOCKS = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const HTML_TAGS = /<\/?[^>]+>/g;
const DANGEROUS_CHARS = /[<>]/g;

export function sanitizeText(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(CONTROL_CHARS, '')
    .replace(SCRIPT_OR_STYLE_BLOCKS, '')
    .replace(HTML_TAGS, '')
    .replace(DANGEROUS_CHARS, '')
    .trim();
}

export const safeText = (max = 255) =>
  z.preprocess(
    (value) => sanitizeText(value),
    z.string().min(1, 'Campo obligatorio.').max(max, `Maximo ${max} caracteres.`)
  );

export const optionalSafeText = (max = 255) =>
  z.preprocess(
    (value) => {
      const sanitized = sanitizeText(value);
      return sanitized === '' ? undefined : sanitized;
    },
    z.string().max(max, `Maximo ${max} caracteres.`).optional()
  );

export const positiveInt = z.coerce.number().int().positive();

export const optionalNumber = ({ min = 0, max = Number.MAX_SAFE_INTEGER } = {}) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.number().min(min).max(max).optional()
  );

export const requiredNumber = ({ min = 0, max = Number.MAX_SAFE_INTEGER } = {}) =>
  z.coerce.number().min(min).max(max);

export function validateRequest(schemas = {}) {
  return (req, res, next) => {
    const parsed = {};

    for (const [source, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[source] ?? {});
      if (!result.success) {
        return res.status(400).json({
          message: 'Entrada invalida.',
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      parsed[source] = result.data;
    }

    req.validated = {
      ...(req.validated || {}),
      ...parsed
    };
    next();
  };
}

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

function hasValidMagicBytes(file) {
  if (!file.buffer || file.buffer.length < 4) return true;

  const bytes = file.buffer;
  if (file.mimetype === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.mimetype === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (file.mimetype === 'image/webp') {
    return bytes.slice(0, 4).toString('ascii') === 'RIFF' && bytes.slice(8, 12).toString('ascii') === 'WEBP';
  }
  if (file.mimetype === 'application/pdf') {
    return bytes.slice(0, 4).toString('ascii') === '%PDF';
  }

  return false;
}

export function validateUploadedFile(file, { maxBytes = 2 * 1024 * 1024 } = {}) {
  if (!file) {
    throw new Error('Archivo obligatorio.');
  }

  const name = sanitizeText(file.originalname || file.name || '').toLowerCase();
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';

  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new Error('Tipo de archivo no permitido.');
  }
  if (!allowedExtensions.has(extension)) {
    throw new Error('Extension de archivo no permitida.');
  }
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > maxBytes) {
    throw new Error('Tamano de archivo invalido.');
  }
  if (!hasValidMagicBytes(file)) {
    throw new Error('Contenido de archivo invalido.');
  }

  return {
    ...file,
    originalname: name
  };
}

export function validateFileUpload(fieldName = 'file', options = {}) {
  return (req, res, next) => {
    try {
      req.validated = {
        ...(req.validated || {}),
        file: validateUploadedFile(req[fieldName], options)
      };
      next();
    } catch (error) {
      res.status(400).json({ message: error.message || 'Archivo invalido.' });
    }
  };
}
