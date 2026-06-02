import dotenv from 'dotenv';
import { pool } from './db.js';
import { generateOpaqueToken, hashPassword, sha256, verifyPassword } from './security.js';
import { clearSessionCookie, getClientIp, getSessionToken, setSessionCookie } from './http.js';

dotenv.config();

const SESSION_TTL_SECONDS = Number.parseInt(process.env.SESSION_TTL_SECONDS || '43200', 10);
const RESET_TTL_MINUTES = Number.parseInt(process.env.RESET_TOKEN_TTL_MINUTES || '30', 10);
const MAX_ACTIVE_SESSIONS = Number.parseInt(process.env.MAX_ACTIVE_SESSIONS || '3', 10);
const PASSWORD_CHANGE_INTERVAL_DAYS = 30;

export async function ensureBootstrapAdmin() {
  const [rows] = await pool.query(
    "SELECT id FROM usuarios WHERE rol = 'administrador' ORDER BY id ASC LIMIT 1"
  );

  if (rows.length > 0) return;

  const nombre = process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador MentorIA';
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@mentoria.local';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'AdminMentoria2026!';
  const passwordHash = await hashPassword(password);

  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, email_verificado_at, password_changed_at)
     VALUES (:nombre, :email, :passwordHash, 'administrador', NOW(), NOW())`,
    { nombre, email: email.toLowerCase(), passwordHash }
  );

  await pool.query(
    `INSERT INTO user_profiles (usuario_id, onboarding_completed)
     VALUES (:usuarioId, 1)`,
    { usuarioId: result.insertId }
  );

  console.log(`Admin bootstrap creado: ${email}`);
}

function normalizeObjective(value) {
  const map = {
    'bajar peso': 'bajar_peso',
    bajar_peso: 'bajar_peso',
    'subir peso': 'subir_peso',
    subir_peso: 'subir_peso',
    mantenerme: 'mantenerme',
    'ganar musculo': 'ganar_musculo',
    ganar_musculo: 'ganar_musculo'
  };

  return map[String(value || '').trim().toLowerCase()] || null;
}

export function calculateDailyCalories({ gender, weightKg, heightCm, age, activityLevel, objective }) {
  const safeWeight = Number(weightKg || 0);
  const safeHeight = Number(heightCm || 0);
  const safeAge = Number(age || 0);
  const activityFactors = {
    sedentario: 1.2,
    ligero: 1.375,
    moderado: 1.55,
    alto: 1.725,
    atleta: 1.9
  };

  const factor = activityFactors[activityLevel] || 1.2;
  const base =
    String(gender || '').toLowerCase() === 'femenino'
      ? 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161
      : 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5;

  const objectiveKey = normalizeObjective(objective);
  if (!base || Number.isNaN(base)) return 0;

  const maintenance = Math.round(base * factor);
  if (objectiveKey === 'bajar_peso') return maintenance - 350;
  if (objectiveKey === 'subir_peso' || objectiveKey === 'ganar_musculo') return maintenance + 250;
  return maintenance;
}

function recommendExercises(objective, trainingFrequency) {
  const objectiveKey = normalizeObjective(objective);
  const sessionsPerWeek = Number(trainingFrequency || 0);

  if (objectiveKey === 'bajar_peso') {
    return sessionsPerWeek >= 4 ? 'HIIT, caminatas inclinadas, fuerza full body' : 'Cardio moderado y fuerza basica';
  }

  if (objectiveKey === 'subir_peso' || objectiveKey === 'ganar_musculo') {
    return 'Fuerza progresiva, hipertrofia, ejercicios compuestos';
  }

  return 'Movilidad, fuerza ligera y cardio sostenible';
}

export async function buildUserSnapshotById(userId) {
  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.nombre,
       u.email,
       u.rol,
       u.avatar_url,
       u.ultimo_login_at,
       u.password_changed_at,
       u.created_at,
       p.onboarding_completed,
       p.objetivo,
       p.daily_calories,
       p.calories_auto_calculated,
       p.training_frequency,
       p.desired_pace,
       p.recommended_exercises,
       p.current_weight_kg,
       p.target_weight_kg,
       p.height_cm,
       p.age,
       p.gender,
       p.activity_level,
       p.assigned_coach_id,
       p.coach_assigned_at,
       coach.nombre AS assigned_coach_name,
       coach.avatar_url AS assigned_coach_avatar
     FROM usuarios u
     LEFT JOIN user_profiles p ON p.usuario_id = u.id
     LEFT JOIN usuarios coach ON coach.id = p.assigned_coach_id
     WHERE u.id = :userId
     LIMIT 1`,
    { userId }
  );

  return rows[0] || null;
}

export function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    avatarUrl: user.avatar_url || null,
    ultimoLoginAt: user.ultimo_login_at || null,
    creadoEn: user.created_at || null,
    onboardingCompleted: Boolean(user.onboarding_completed),
    profile: {
      objetivo: user.objetivo || null,
      dailyCalories: user.daily_calories || null,
      caloriesAutoCalculated: Boolean(user.calories_auto_calculated),
      trainingFrequency: user.training_frequency || null,
      desiredPace: user.desired_pace || null,
      recommendedExercises: user.recommended_exercises || null,
      currentWeightKg: user.current_weight_kg || null,
      targetWeightKg: user.target_weight_kg || null,
      heightCm: user.height_cm || null,
      age: user.age || null,
      gender: user.gender || null,
      activityLevel: user.activity_level || null
    },
    assignedCoach: user.assigned_coach_id
      ? {
          id: user.assigned_coach_id,
          nombre: user.assigned_coach_name,
          avatarUrl: user.assigned_coach_avatar || null,
          assignedAt: user.coach_assigned_at || null
        }
      : null,
    canChangePassword: !user.password_changed_at
      || daysBetween(user.password_changed_at, new Date()) >= PASSWORD_CHANGE_INTERVAL_DAYS
  };
}

function daysBetween(older, newer) {
  const diffMs = new Date(newer).getTime() - new Date(older).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT id, nombre, email, rol, avatar_url, password_hash, ultimo_login_at, password_changed_at, created_at
     FROM usuarios
     WHERE email = :email
     LIMIT 1`,
    { email: String(email || '').trim().toLowerCase() }
  );

  return rows[0] || null;
}

export async function createUser({ nombre, email, password, rol = 'usuario' }) {
  const passwordHash = await hashPassword(password);
  const normalizedEmail = String(email).trim().toLowerCase();
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, email_verificado_at, password_changed_at)
     VALUES (:nombre, :email, :passwordHash, :rol, NOW(), NOW())`,
    { nombre: nombre.trim(), email: normalizedEmail, passwordHash, rol }
  );

  await pool.query(
    `INSERT INTO user_profiles (usuario_id, onboarding_completed)
     VALUES (:usuarioId, :onboardingCompleted)`,
    { usuarioId: result.insertId, onboardingCompleted: rol === 'usuario' ? 0 : 1 }
  );

  return buildUserSnapshotById(result.insertId);
}

export async function authenticateUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;

  return buildUserSnapshotById(user.id);
}

export async function createSessionForUser(userId, req, res) {
  const token = generateOpaqueToken();
  const tokenHash = sha256(token);
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  await pool.query(
    `INSERT INTO user_sessions (usuario_id, token_hash, user_agent, ip_address, expires_at)
     VALUES (:usuarioId, :tokenHash, :userAgent, :ipAddress, DATE_ADD(NOW(), INTERVAL :ttl SECOND))`,
    { usuarioId: userId, tokenHash, userAgent, ipAddress, ttl: SESSION_TTL_SECONDS }
  );

  await pool.query(`UPDATE usuarios SET ultimo_login_at = NOW() WHERE id = :id`, { id: userId });

  await pool.query(
    `UPDATE user_sessions
     SET revoked_at = NOW()
     WHERE id IN (
       SELECT id FROM (
         SELECT id
         FROM user_sessions
         WHERE usuario_id = :usuarioId AND revoked_at IS NULL AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 18446744073709551615 OFFSET :offsetValue
       ) AS overflow_rows
     )`,
    { usuarioId: userId, offsetValue: MAX_ACTIVE_SESSIONS }
  );

  setSessionCookie(res, token);
  return token;
}

export async function getCurrentSession(req) {
  const token = getSessionToken(req);
  if (!token) return null;

  const tokenHash = sha256(token);
  const [rows] = await pool.query(
    `SELECT
       s.id AS session_id,
       s.user_agent,
       s.ip_address,
       s.created_at AS session_created_at,
       s.expires_at,
       u.id AS usuario_id
     FROM user_sessions s
     JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.token_hash = :tokenHash
       AND s.revoked_at IS NULL
       AND s.expires_at > NOW()
     LIMIT 1`,
    { tokenHash }
  );

  const row = rows[0];
  if (!row) return null;

  await pool.query(
    `UPDATE user_sessions
     SET last_activity_at = NOW(),
         expires_at = DATE_ADD(NOW(), INTERVAL :ttl SECOND)
     WHERE id = :id`,
    { ttl: SESSION_TTL_SECONDS, id: row.session_id }
  );

  const user = await buildUserSnapshotById(row.usuario_id);
  if (!user) return null;

  return {
    ...user,
    session: {
      id: row.session_id,
      userAgent: row.user_agent,
      ipAddress: row.ip_address,
      createdAt: row.session_created_at,
      expiresAt: row.expires_at
    }
  };
}

export async function revokeCurrentSession(req, res) {
  const token = getSessionToken(req);
  if (token) {
    await pool.query(
      `UPDATE user_sessions SET revoked_at = NOW() WHERE token_hash = :tokenHash AND revoked_at IS NULL`,
      { tokenHash: sha256(token) }
    );
  }

  clearSessionCookie(res);
}

export async function revokeAllUserSessions(userId) {
  await pool.query(
    `UPDATE user_sessions
     SET revoked_at = NOW()
     WHERE usuario_id = :usuarioId AND revoked_at IS NULL`,
    { usuarioId: userId }
  );
}

export async function listActiveSessions(userId) {
  const [rows] = await pool.query(
    `SELECT id, user_agent, ip_address, created_at, last_activity_at, expires_at
     FROM user_sessions
     WHERE usuario_id = :usuarioId AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY last_activity_at DESC`,
    { usuarioId: userId }
  );

  return rows.map((session) => ({
    id: session.id,
    userAgent: session.user_agent,
    ipAddress: session.ip_address,
    createdAt: session.created_at,
    lastActivityAt: session.last_activity_at,
    expiresAt: session.expires_at
  }));
}

export async function createPasswordResetToken(userId) {
  const plainToken = generateOpaqueToken();
  const tokenHash = sha256(plainToken);

  await pool.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE usuario_id = :usuarioId AND used_at IS NULL`,
    { usuarioId: userId }
  );

  await pool.query(
    `INSERT INTO password_reset_tokens (usuario_id, token_hash, expires_at)
     VALUES (:usuarioId, :tokenHash, DATE_ADD(NOW(), INTERVAL :ttl MINUTE))`,
    { usuarioId: userId, tokenHash, ttl: RESET_TTL_MINUTES }
  );

  return plainToken;
}

export async function consumePasswordResetToken(token, newPassword) {
  const tokenHash = sha256(token);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, usuario_id
       FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    const resetRow = rows[0];
    if (!resetRow) {
      throw new Error('El enlace de restablecimiento es invalido o ya expiro.');
    }

    const passwordHash = await hashPassword(newPassword);

    await connection.query(
      `UPDATE usuarios
       SET password_hash = ?, password_changed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [passwordHash, resetRow.usuario_id]
    );

    await connection.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`, [resetRow.id]);
    await connection.query(
      `UPDATE user_sessions
       SET revoked_at = NOW()
       WHERE usuario_id = ? AND revoked_at IS NULL`,
      [resetRow.usuario_id]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateUserProfile(userId, payload) {
  const profile = await buildUserSnapshotById(userId);
  if (!profile) {
    throw new Error('Usuario no encontrado.');
  }

  const nombre = payload.nombre?.trim() || profile.nombre;
  const objetivo = normalizeObjective(payload.objetivo) || profile.objetivo;
  const dailyCalories = payload.dailyCalories ? Number(payload.dailyCalories) : profile.daily_calories;
  const trainingFrequency = payload.trainingFrequency ? Number(payload.trainingFrequency) : profile.training_frequency;
  const desiredPace = payload.desiredPace || profile.desired_pace;
  const currentWeightKg = payload.currentWeightKg ? Number(payload.currentWeightKg) : profile.current_weight_kg;
  const targetWeightKg = payload.targetWeightKg ? Number(payload.targetWeightKg) : profile.target_weight_kg;
  const heightCm = payload.heightCm ? Number(payload.heightCm) : profile.height_cm;
  const age = payload.age ? Number(payload.age) : profile.age;
  const gender = payload.gender || profile.gender;
  const activityLevel = payload.activityLevel || profile.activity_level;
  const caloriesAutoCalculated = payload.caloriesAutoCalculated ? 1 : 0;
  const recommendedExercises = payload.recommendedExercises
    || recommendExercises(objetivo, trainingFrequency);

  await pool.query(`UPDATE usuarios SET nombre = :nombre WHERE id = :id`, { nombre, id: userId });
  await pool.query(
    `UPDATE user_profiles
     SET objetivo = :objetivo,
         daily_calories = :dailyCalories,
         calories_auto_calculated = :caloriesAutoCalculated,
         training_frequency = :trainingFrequency,
         desired_pace = :desiredPace,
         recommended_exercises = :recommendedExercises,
         current_weight_kg = :currentWeightKg,
         target_weight_kg = :targetWeightKg,
         height_cm = :heightCm,
         age = :age,
         gender = :gender,
         activity_level = :activityLevel
     WHERE usuario_id = :userId`,
    {
      objetivo,
      dailyCalories,
      caloriesAutoCalculated,
      trainingFrequency,
      desiredPace,
      recommendedExercises,
      currentWeightKg,
      targetWeightKg,
      heightCm,
      age,
      gender,
      activityLevel,
      userId
    }
  );

  return buildUserSnapshotById(userId);
}

export async function completeUserOnboarding(userId, payload) {
  let dailyCalories = payload.dailyCalories ? Number(payload.dailyCalories) : 0;
  let caloriesAutoCalculated = 0;

  if (!dailyCalories) {
    dailyCalories = calculateDailyCalories({
      gender: payload.gender,
      weightKg: payload.currentWeightKg,
      heightCm: payload.heightCm,
      age: payload.age,
      activityLevel: payload.activityLevel,
      objective: payload.objetivo
    });
    caloriesAutoCalculated = 1;
  }

  const updated = await updateUserProfile(userId, {
    ...payload,
    dailyCalories,
    caloriesAutoCalculated,
    recommendedExercises: recommendExercises(payload.objetivo, payload.trainingFrequency)
  });

  await pool.query(
    `UPDATE user_profiles SET onboarding_completed = 1 WHERE usuario_id = :userId`,
    { userId }
  );

  if (payload.currentWeightKg) {
    await addProgressLog(userId, {
      weightKg: Number(payload.currentWeightKg),
      notes: 'Registro inicial'
    });
  }

  return buildUserSnapshotById(updated.id);
}

export async function addProgressLog(userId, { weightKg, notes }) {
  await pool.query(
    `INSERT INTO user_progress_logs (usuario_id, weight_kg, notes)
     VALUES (:usuarioId, :weightKg, :notes)`,
    { usuarioId: userId, weightKg: Number(weightKg), notes: notes || null }
  );

  await pool.query(
    `UPDATE user_profiles
     SET current_weight_kg = :weightKg
     WHERE usuario_id = :usuarioId`,
    { usuarioId: userId, weightKg: Number(weightKg) }
  );
}

export async function getProgressHistory(userId) {
  const [rows] = await pool.query(
    `SELECT id, weight_kg, notes, created_at
     FROM user_progress_logs
     WHERE usuario_id = :usuarioId
     ORDER BY created_at DESC
     LIMIT 20`,
    { usuarioId: userId }
  );

  return rows.map((row) => ({
    id: row.id,
    weightKg: row.weight_kg,
    notes: row.notes,
    createdAt: row.created_at
  }));
}

export async function changePasswordOncePerMonth(userId, currentPassword, nextPassword) {
  const user = await findUserByEmail((await buildUserSnapshotById(userId)).email);
  if (!user) {
    throw new Error('Usuario no encontrado.');
  }

  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) {
    throw new Error('La contrasena actual no coincide.');
  }

  if (user.password_changed_at && daysBetween(user.password_changed_at, new Date()) < PASSWORD_CHANGE_INTERVAL_DAYS) {
    throw new Error('Solo puedes cambiar tu contrasena una vez cada 30 dias.');
  }

  const passwordHash = await hashPassword(nextPassword);
  await pool.query(
    `UPDATE usuarios
     SET password_hash = :passwordHash, password_changed_at = NOW()
     WHERE id = :userId`,
    { passwordHash, userId }
  );

  await revokeAllUserSessions(userId);
}

export async function submitCoachApplication(userId, payload) {
  const [existing] = await pool.query(
    `SELECT id FROM coach_applications WHERE usuario_id = :usuarioId LIMIT 1`,
    { usuarioId: userId }
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE coach_applications
       SET bio = :bio,
           specialties = :specialties,
           experience_years = :experienceYears,
           status = 'pendiente',
           rejection_reason = NULL,
           reviewed_by = NULL,
           reviewed_at = NULL
       WHERE usuario_id = :usuarioId`,
      {
        bio: payload.bio.trim(),
        specialties: payload.specialties.trim(),
        experienceYears: Number(payload.experienceYears || 0),
        usuarioId: userId
      }
    );
    return;
  }

  await pool.query(
    `INSERT INTO coach_applications (usuario_id, bio, specialties, experience_years)
     VALUES (:usuarioId, :bio, :specialties, :experienceYears)`,
    {
      usuarioId: userId,
      bio: payload.bio.trim(),
      specialties: payload.specialties.trim(),
      experienceYears: Number(payload.experienceYears || 0)
    }
  );
}

export async function listCoachApplications() {
  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.bio,
       a.specialties,
       a.experience_years,
       a.status,
       a.rejection_reason,
       a.created_at,
       u.id AS usuario_id,
       u.nombre,
       u.email
     FROM coach_applications a
     JOIN usuarios u ON u.id = a.usuario_id
     ORDER BY FIELD(a.status, 'pendiente', 'rechazada', 'aprobada'), a.created_at DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    bio: row.bio,
    specialties: row.specialties,
    experienceYears: row.experience_years,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    usuario: {
      id: row.usuario_id,
      nombre: row.nombre,
      email: row.email
    }
  }));
}

export async function reviewCoachApplication(applicationId, reviewerId, decision, rejectionReason = null) {
  const [rows] = await pool.query(
    `SELECT usuario_id FROM coach_applications WHERE id = :applicationId LIMIT 1`,
    { applicationId }
  );

  const application = rows[0];
  if (!application) {
    throw new Error('Solicitud no encontrada.');
  }

  const status = decision === 'aprobar' ? 'aprobada' : 'rechazada';

  await pool.query(
    `UPDATE coach_applications
     SET status = :status,
         rejection_reason = :rejectionReason,
         reviewed_by = :reviewedBy,
         reviewed_at = NOW()
     WHERE id = :applicationId`,
    { status, rejectionReason, reviewedBy: reviewerId, applicationId }
  );

  if (status === 'aprobada') {
    await pool.query(`UPDATE usuarios SET rol = 'coach' WHERE id = :usuarioId`, {
      usuarioId: application.usuario_id
    });
    await pool.query(`UPDATE user_profiles SET onboarding_completed = 1 WHERE usuario_id = :usuarioId`, {
      usuarioId: application.usuario_id
    });
  }
}

export async function listApprovedCoaches() {
  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.nombre,
       u.avatar_url,
       a.bio,
       a.specialties,
       a.experience_years,
       COUNT(p.usuario_id) AS active_clients
     FROM usuarios u
     JOIN coach_applications a ON a.usuario_id = u.id AND a.status = 'aprobada'
     LEFT JOIN user_profiles p ON p.assigned_coach_id = u.id
     WHERE u.rol = 'coach'
     GROUP BY u.id, u.nombre, u.avatar_url, a.bio, a.specialties, a.experience_years
     ORDER BY active_clients ASC, a.created_at DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    avatarUrl: row.avatar_url || null,
    bio: row.bio,
    specialties: row.specialties,
    experienceYears: row.experience_years,
    activeClients: row.active_clients
  }));
}

export async function assignCoachToUser(userId, coachId) {
  const [coachRows] = await pool.query(
    `SELECT id FROM usuarios WHERE id = :coachId AND rol = 'coach' LIMIT 1`,
    { coachId }
  );

  if (coachRows.length === 0) {
    throw new Error('El coach seleccionado no esta disponible.');
  }

  await pool.query(
    `UPDATE user_profiles
     SET assigned_coach_id = :coachId, coach_assigned_at = NOW()
     WHERE usuario_id = :usuarioId`,
    { coachId, usuarioId: userId }
  );

  return buildUserSnapshotById(userId);
}

export async function unassignCoachFromUser(userId) {
  await pool.query(
    `UPDATE user_profiles
     SET assigned_coach_id = NULL, coach_assigned_at = NULL
     WHERE usuario_id = :usuarioId`,
    { usuarioId: userId }
  );

  return buildUserSnapshotById(userId);
}

export async function listCoachClients(coachId) {
  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.nombre,
       u.email,
       p.objetivo,
       p.current_weight_kg,
       p.target_weight_kg,
       p.height_cm,
       p.daily_calories,
       p.recommended_exercises,
       p.training_frequency,
       (
         SELECT weight_kg FROM user_progress_logs logs
         WHERE logs.usuario_id = u.id
         ORDER BY created_at DESC
         LIMIT 1
       ) AS latest_weight,
       (
         SELECT weight_kg FROM user_progress_logs logs
         WHERE logs.usuario_id = u.id
         ORDER BY created_at ASC
         LIMIT 1
       ) AS initial_weight
     FROM user_profiles p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.assigned_coach_id = :coachId
     ORDER BY u.nombre ASC`,
    { coachId }
  );

  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    objetivo: row.objetivo,
    currentWeightKg: row.current_weight_kg,
    targetWeightKg: row.target_weight_kg,
    heightCm: row.height_cm,
    dailyCalories: row.daily_calories,
    recommendedExercises: row.recommended_exercises,
    trainingFrequency: row.training_frequency,
    initialWeight: row.initial_weight,
    latestWeight: row.latest_weight,
    progressDelta:
      row.initial_weight && row.latest_weight
        ? Number(row.latest_weight) - Number(row.initial_weight)
        : 0
  }));
}
