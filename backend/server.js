import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {
  addProgressLog,
  assignCoachToUser,
  authenticateUser,
  buildUserSnapshotById,
  calculateDailyCalories,
  changePasswordOncePerMonth,
  completeUserOnboarding,
  consumePasswordResetToken,
  createPasswordResetToken,
  createSessionForUser,
  createUser,
  ensureBootstrapAdmin,
  findUserByEmail,
  getCurrentSession,
  getProgressHistory,
  listActiveSessions,
  listApprovedCoaches,
  listCoachApplications,
  listCoachClients,
  reviewCoachApplication,
  revokeAllUserSessions,
  revokeCurrentSession,
  sanitizeUser,
  submitCoachApplication,
  unassignCoachFromUser,
  updateUserProfile
} from './lib/auth.js';
import { pool } from './lib/db.js';
import { sendPasswordResetEmail } from './lib/mailer.js';
import { requireLogin, requireRole } from './lib/middleware.js';
import { isStrongPassword } from './lib/security.js';
import { getResourceBySlug, getSearchMeta, searchResources } from './lib/searchService.js';

dotenv.config();

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'mentoria-backend' });
});

app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, password } = req.body || {};

  if (!nombre?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: 'Nombre, email y password son obligatorios.' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: 'La contrasena debe tener minimo 10 caracteres, mayuscula, minuscula y numero.'
    });
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Ese correo ya esta registrado.' });
    }

    const user = await createUser({ nombre, email, password, rol: 'usuario' });
    await createSessionForUser(user.id, req, res);
    res.status(201).json({
      user: sanitizeUser(user),
      redirectTo: '/app/onboarding'
    });
  } catch (error) {
    console.error('Error /api/auth/register', error);
    res.status(500).json({ message: 'No se pudo crear la cuenta.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: 'Email y password son obligatorios.' });
  }

  try {
    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales invalidas.' });
    }

    await createSessionForUser(user.id, req, res);
    res.json({
      user: sanitizeUser(user),
      redirectTo: getRedirectByUser(user)
    });
  } catch (error) {
    console.error('Error /api/auth/login', error);
    res.status(500).json({ message: 'No se pudo iniciar sesion.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const current = await getCurrentSession(req);
    if (!current) {
      return res.status(401).json({ message: 'No hay sesion activa.' });
    }

    res.json({
      user: sanitizeUser(current),
      session: current.session
    });
  } catch (error) {
    console.error('Error /api/auth/me', error);
    res.status(500).json({ message: 'No se pudo validar la sesion.' });
  }
});

app.patch('/api/auth/profile', requireLogin, async (req, res) => {
  try {
    const updated = await updateUserProfile(req.user.id, req.body || {});
    res.json({ user: sanitizeUser(updated) });
  } catch (error) {
    console.error('Error /api/auth/profile', error);
    res.status(400).json({ message: error.message || 'No se pudo actualizar el perfil.' });
  }
});

app.post('/api/auth/onboarding', requireLogin, requireRole('usuario'), async (req, res) => {
  try {
    const updated = await completeUserOnboarding(req.user.id, req.body || {});
    res.json({ user: sanitizeUser(updated), redirectTo: '/app' });
  } catch (error) {
    console.error('Error /api/auth/onboarding', error);
    res.status(400).json({ message: error.message || 'No se pudo completar el onboarding.' });
  }
});

app.post('/api/auth/change-password', requireLogin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Debes indicar la contrasena actual y la nueva.' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      message: 'La nueva contrasena debe tener minimo 10 caracteres, mayuscula, minuscula y numero.'
    });
  }

  try {
    await changePasswordOncePerMonth(req.user.id, currentPassword, newPassword);
    await revokeCurrentSession(req, res);
    res.json({ message: 'Contrasena actualizada. Debes iniciar sesion nuevamente.' });
  } catch (error) {
    console.error('Error /api/auth/change-password', error);
    res.status(400).json({ message: error.message || 'No se pudo cambiar la contrasena.' });
  }
});

app.get('/api/auth/sessions', requireLogin, async (req, res) => {
  try {
    const sessions = await listActiveSessions(req.user.id);
    res.json({ sessions, currentSessionId: req.sessionInfo.id });
  } catch (error) {
    console.error('Error /api/auth/sessions', error);
    res.status(500).json({ message: 'No se pudieron obtener las sesiones activas.' });
  }
});

app.post('/api/auth/logout', requireLogin, async (req, res) => {
  try {
    await revokeCurrentSession(req, res);
    res.json({ message: 'Sesion cerrada correctamente.' });
  } catch (error) {
    console.error('Error /api/auth/logout', error);
    res.status(500).json({ message: 'No se pudo cerrar la sesion.' });
  }
});

app.post('/api/auth/logout-all', requireLogin, async (req, res) => {
  try {
    await revokeAllUserSessions(req.user.id);
    await revokeCurrentSession(req, res);
    res.json({ message: 'Se cerraron todas las sesiones activas.' });
  } catch (error) {
    console.error('Error /api/auth/logout-all', error);
    res.status(500).json({ message: 'No se pudieron cerrar las sesiones.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};

  if (!email?.trim()) {
    return res.status(400).json({ message: 'Debes indicar el correo de la cuenta.' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.json({
        message: 'Si el correo existe, recibira instrucciones para restablecer la contrasena.'
      });
    }

    const plainToken = await createPasswordResetToken(user.id);
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/restablecer-password?token=${encodeURIComponent(plainToken)}`;
    const delivery = await sendPasswordResetEmail({
      email: user.email,
      nombre: user.nombre,
      resetUrl
    });

    res.json({
      message: 'Si el correo existe, recibira instrucciones para restablecer la contrasena.',
      previewUrl: delivery.previewUrl || null
    });
  } catch (error) {
    console.error('Error /api/auth/forgot-password', error);
    res.status(500).json({ message: 'No se pudo procesar la recuperacion.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body || {};

  if (!token || !password) {
    return res.status(400).json({ message: 'Token y nueva contrasena son obligatorios.' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: 'La contrasena debe tener minimo 10 caracteres, mayuscula, minuscula y numero.'
    });
  }

  try {
    await consumePasswordResetToken(token, password);
    res.json({ message: 'La contrasena se actualizo correctamente. Inicia sesion de nuevo.' });
  } catch (error) {
    const statusCode = error.message?.includes('invalido') ? 400 : 500;
    console.error('Error /api/auth/reset-password', error);
    res.status(statusCode).json({ message: error.message || 'No se pudo restablecer la contrasena.' });
  }
});

app.post('/api/coach/apply', requireLogin, requireRole('usuario'), async (req, res) => {
  const { bio, specialties, experienceYears } = req.body || {};

  if (!bio?.trim() || !specialties?.trim()) {
    return res.status(400).json({ message: 'Bio y especialidades son obligatorias.' });
  }

  try {
    await submitCoachApplication(req.user.id, { bio, specialties, experienceYears });
    res.json({ message: 'Solicitud enviada. Un administrador la revisara.' });
  } catch (error) {
    console.error('Error /api/coach/apply', error);
    res.status(500).json({ message: 'No se pudo enviar la solicitud.' });
  }
});

app.get('/api/coaches', requireLogin, async (_req, res) => {
  try {
    const coaches = await listApprovedCoaches();
    res.json(coaches);
  } catch (error) {
    console.error('Error /api/coaches', error);
    res.status(500).json({ message: 'No se pudieron cargar los coaches.' });
  }
});

app.post('/api/users/me/coach-assignment', requireLogin, requireRole('usuario'), async (req, res) => {
  const { coachId } = req.body || {};

  if (!coachId) {
    return res.status(400).json({ message: 'Debes seleccionar un coach.' });
  }

  try {
    const updated = await assignCoachToUser(req.user.id, Number(coachId));
    res.json({ user: sanitizeUser(updated) });
  } catch (error) {
    console.error('Error /api/users/me/coach-assignment', error);
    res.status(400).json({ message: error.message || 'No se pudo asignar el coach.' });
  }
});

app.delete('/api/users/me/coach-assignment', requireLogin, requireRole('usuario'), async (req, res) => {
  try {
    const updated = await unassignCoachFromUser(req.user.id);
    res.json({ user: sanitizeUser(updated) });
  } catch (error) {
    console.error('Error DELETE /api/users/me/coach-assignment', error);
    res.status(500).json({ message: 'No se pudo quitar el coach.' });
  }
});

app.post('/api/users/me/progress', requireLogin, requireRole('usuario'), async (req, res) => {
  const { weightKg, notes } = req.body || {};

  if (!weightKg) {
    return res.status(400).json({ message: 'Debes indicar tu peso actual.' });
  }

  try {
    await addProgressLog(req.user.id, { weightKg, notes });
    const history = await getProgressHistory(req.user.id);
    const user = await buildUserSnapshotById(req.user.id);
    res.json({ history, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Error /api/users/me/progress', error);
    res.status(500).json({ message: 'No se pudo guardar el progreso.' });
  }
});

app.get('/api/users/me/progress', requireLogin, requireRole('usuario'), async (req, res) => {
  try {
    const history = await getProgressHistory(req.user.id);
    res.json(history);
  } catch (error) {
    console.error('Error GET /api/users/me/progress', error);
    res.status(500).json({ message: 'No se pudo obtener el progreso.' });
  }
});

app.get('/api/coach/clients', requireLogin, requireRole('coach'), async (req, res) => {
  try {
    const clients = await listCoachClients(req.user.id);
    res.json(clients);
  } catch (error) {
    console.error('Error /api/coach/clients', error);
    res.status(500).json({ message: 'No se pudo obtener el seguimiento de clientes.' });
  }
});

app.get('/api/admin/coach-applications', requireLogin, requireRole('administrador'), async (_req, res) => {
  try {
    const applications = await listCoachApplications();
    res.json(applications);
  } catch (error) {
    console.error('Error /api/admin/coach-applications', error);
    res.status(500).json({ message: 'No se pudieron obtener las solicitudes.' });
  }
});

app.post('/api/admin/coach-applications/:id/review', requireLogin, requireRole('administrador'), async (req, res) => {
  const { decision, rejectionReason } = req.body || {};

  if (!['aprobar', 'rechazar'].includes(decision)) {
    return res.status(400).json({ message: 'Decision invalida.' });
  }

  try {
    await reviewCoachApplication(Number(req.params.id), req.user.id, decision, rejectionReason || null);
    const applications = await listCoachApplications();
    res.json({ applications });
  } catch (error) {
    console.error('Error /api/admin/coach-applications/:id/review', error);
    res.status(400).json({ message: error.message || 'No se pudo revisar la solicitud.' });
  }
});

app.post('/api/tools/calculate-calories', requireLogin, async (req, res) => {
  const { gender, weightKg, heightCm, age, activityLevel, objective } = req.body || {};
  const calories = calculateDailyCalories({
    gender,
    weightKg,
    heightCm,
    age,
    activityLevel,
    objective
  });
  res.json({ calories });
});

app.get('/api/metrics', requireLogin, async (req, res) => {
  try {
    const snapshot = await buildUserSnapshotById(req.user.id);
    const [
      [activeUsersRows],
      [coachRows],
      [sessionsRows],
      [goalsRows],
      [campaignsRows],
      [remindersRows],
      [moodRows]
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS value, 8 AS trend, 'Miembros activos' AS label FROM usuarios WHERE rol = 'usuario'"),
      pool.query("SELECT COUNT(*) AS value, 4 AS trend, 'Coaches aprobados' AS label FROM usuarios WHERE rol = 'coach'"),
      pool.query(`SELECT COUNT(*) AS value, 6 AS trend, 'Sesiones del mes' AS label FROM sessions
                  WHERE MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())`),
      pool.query('SELECT label, value FROM goals'),
      pool.query('SELECT title, tag, image, cta FROM campaigns ORDER BY id'),
      pool.query('SELECT title, time_label AS time FROM reminders ORDER BY id'),
      pool.query('SELECT label, value FROM mood ORDER BY id')
    ]);

    const pipeline = [];
    if (req.user.rol === 'coach') {
      const clients = await listCoachClients(req.user.id);
      clients.forEach((client) => {
        pipeline.push({
          name: client.nombre.split(' ')[0],
          engagement: Math.max(52, 100 - Math.abs(client.progressDelta || 0) * 5)
        });
      });
    } else {
      const [rows] = await pool.query('SELECT name, engagement FROM clients ORDER BY engagement DESC LIMIT 8');
      pipeline.push(...rows);
    }

    const [upcomingSessions] = await pool.query(
      `SELECT s.id, c.name AS client, s.topic,
        DATE_FORMAT(s.date, '%d %b %Y') AS date, TIME_FORMAT(s.time, '%H:%i') AS time
       FROM sessions s
       JOIN clients c ON c.id = s.client_id
       ORDER BY s.date, s.time
       LIMIT 6`
    );

    const personalisedKpis = [
      activeUsersRows[0],
      coachRows[0],
      sessionsRows[0]
    ];

    if (snapshot?.profile?.currentWeightKg && snapshot?.profile?.targetWeightKg) {
      personalisedKpis[0] = {
        label: 'Mi progreso',
        value: `${snapshot.profile.currentWeightKg} kg`,
        trend: Number(snapshot.profile.targetWeightKg) < Number(snapshot.profile.currentWeightKg) ? -2 : 3
      };
    }

    res.json({
      kpis: personalisedKpis,
      pipeline,
      goals: goalsRows,
      sessions: upcomingSessions,
      campaigns: campaignsRows,
      reminders: remindersRows,
      mood: moodRows,
      spotlight: {
        coach: snapshot?.assignedCoach || null,
        onboardingCompleted: Boolean(snapshot?.onboarding_completed || snapshot?.onboardingCompleted),
        objective: snapshot?.objetivo || snapshot?.profile?.objetivo || null
      }
    });
  } catch (err) {
    console.error('Error /api/metrics', err);
    res.status(500).json({ message: 'Error obteniendo metricas' });
  }
});

app.get('/api/search/meta', (_req, res) => {
  res.json(getSearchMeta());
});

app.get('/api/search', async (req, res) => {
  try {
    res.json(searchResources(req.query));
  } catch (err) {
    console.error('Error /api/search', err);
    const statusCode = err.message?.includes('debe') || err.message?.includes('no puede') ? 400 : 500;
    res.status(statusCode).json({ message: err.message || 'No se pudo procesar la busqueda.' });
  }
});

app.get('/api/search/resource/:slug', async (req, res) => {
  const resource = getResourceBySlug(req.params.slug);
  if (!resource) {
    return res.status(404).json({ message: 'Recurso no encontrado.' });
  }

  res.json(resource);
});

app.get('/api/clients', requireLogin, requireRole('administrador'), async (_req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id, name, goal, status,
      DATE_FORMAT(next_session, '%d %b %Y') AS nextSession, score, engagement, avatar_url
      FROM clients ORDER BY id DESC`);
    const mapped = rows.map((row) => ({
      ...row,
      statusLabel: statusLabel(row.status)
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Error /api/clients', err);
    res.status(500).json({ message: 'Error obteniendo clientes' });
  }
});

app.get('/api/sessions', requireLogin, async (_req, res) => {
  try {
    const [rows] = await pool.query(`SELECT s.id, c.name AS client, s.topic,
      DATE_FORMAT(s.date, '%d %b %Y') AS date, TIME_FORMAT(s.time, '%H:%i') AS time, s.status
      FROM sessions s JOIN clients c ON s.client_id = c.id
      ORDER BY s.date, s.time`);
    res.json(rows);
  } catch (err) {
    console.error('Error /api/sessions', err);
    res.status(500).json({ message: 'Error obteniendo sesiones' });
  }
});

app.get('/api/sessions/:id', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, c.name AS client, s.topic, s.status, s.location,
        DATE_FORMAT(s.date, '%d %b %Y') AS date, TIME_FORMAT(s.time, '%H:%i') AS time
       FROM sessions s
       JOIN clients c ON s.client_id = c.id
       WHERE s.id = :id
       LIMIT 1`,
      { id: Number(req.params.id) }
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Sesion no encontrada.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error /api/sessions/:id', err);
    res.status(500).json({ message: 'No se pudo obtener el detalle de la sesion.' });
  }
});

app.post('/api/sessions', requireLogin, async (req, res) => {
  const { clientId, topic, date, time, location } = req.body || {};
  if (!clientId || !topic || !date || !time) {
    return res.status(400).json({ message: 'Cliente, tema, fecha y hora son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO sessions (client_id, topic, date, time, status, location)
       VALUES (:clientId, :topic, :date, :time, 'programada', :location)`,
      { clientId: Number(clientId), topic: topic.trim(), date, time, location: location || 'Online' }
    );

    const [rows] = await pool.query(
      `SELECT s.id, c.name AS client, s.topic, s.status, s.location,
        DATE_FORMAT(s.date, '%d %b %Y') AS date, TIME_FORMAT(s.time, '%H:%i') AS time
       FROM sessions s
       JOIN clients c ON s.client_id = c.id
       WHERE s.id = :id
       LIMIT 1`,
      { id: result.insertId }
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error POST /api/sessions', err);
    res.status(500).json({ message: 'No se pudo crear la sesion.' });
  }
});

app.get('/api/sessions-export', requireLogin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, c.name AS client, s.topic, s.status, s.location,
        DATE_FORMAT(s.date, '%Y-%m-%d') AS date, TIME_FORMAT(s.time, '%H:%i') AS time
       FROM sessions s
       JOIN clients c ON s.client_id = c.id
       ORDER BY s.date, s.time`
    );

    const header = 'id,cliente,tema,fecha,hora,estado,ubicacion';
    const lines = rows.map((row) =>
      [row.id, row.client, row.topic, row.date, row.time, row.status, row.location]
        .map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`)
        .join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="sesiones.csv"');
    res.send([header, ...lines].join('\n'));
  } catch (err) {
    console.error('Error /api/sessions-export', err);
    res.status(500).json({ message: 'No se pudo exportar la agenda.' });
  }
});

app.post('/api/chat', requireLogin, async (req, res) => {
  const { message } = req.body;

  try {
    const current = await buildUserSnapshotById(req.user.id);
    const objective = current?.objetivo || current?.profile?.objetivo || 'mantenerme';
    const assignedCoach = current?.assigned_coach_name || current?.assignedCoach?.nombre;
    const reply = assignedCoach
      ? `Tu coach actual es ${assignedCoach}. Segun tu objetivo ${formatObjective(objective)}, te recomiendo mantener constancia y registrar tu progreso semanal.`
      : `Tu objetivo actual es ${formatObjective(objective)}. Aun no tienes coach asignado, pero puedes elegir uno desde la seccion Coaches.`;
    res.json({ reply, echo: message });
  } catch (err) {
    console.error('Error /api/chat', err);
    res.status(500).json({ reply: 'No pude consultar tu perfil ahora.' });
  }
});

function getRedirectByUser(user) {
  if (user.rol === 'administrador') return '/app/admin/coaches';
  if (user.rol === 'coach') return '/app/coach';
  if (!user.onboarding_completed && !user.onboardingCompleted) return '/app/onboarding';
  return '/app';
}

function formatObjective(objective) {
  const map = {
    bajar_peso: 'bajar peso',
    subir_peso: 'subir peso',
    mantenerme: 'mantenerme',
    ganar_musculo: 'ganar musculo'
  };
  return map[objective] || objective;
}

function statusLabel(status) {
  return status === 'activo' ? 'Activo' : status === 'riesgo' ? 'En riesgo' : 'Inactivo';
}

const port = process.env.PORT || 4000;
ensureBootstrapAdmin()
  .then(() => {
    app.listen(port, () => console.log(`Backend listo en http://localhost:${port}`));
  })
  .catch((error) => {
    console.error('No se pudo iniciar el backend', error);
    process.exit(1);
  });
