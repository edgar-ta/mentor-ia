import { z } from 'zod';
import { optionalNumber, optionalSafeText, positiveInt, requiredNumber, safeText } from './validation.js';

const email = z.preprocess(
  (value) => String(value ?? '').trim().toLowerCase(),
  z.string().email('Correo invalido.').max(254)
);

const password = z.string().min(1).max(128);
const strongPassword = password.min(10, 'La contrasena debe tener minimo 10 caracteres.');

const objective = z.enum(['bajar_peso', 'subir_peso', 'mantenerme', 'ganar_musculo']);
const gender = z.enum(['masculino', 'femenino', 'otro']);
const activityLevel = z.enum(['sedentario', 'ligero', 'moderado', 'alto', 'atleta']);
const desiredPace = z.enum(['tranquilo', 'equilibrado', 'intenso']);
const decision = z.enum(['aprobar', 'rechazar']);
const sort = z.enum(['relevance', 'newest', 'price_asc', 'price_desc']);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida.');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora invalida.');
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalido.').max(120);
const optionalEnum = (schema) =>
  z.preprocess((value) => (value === '' || value === null ? undefined : value), schema.optional());

const profileFields = {
  nombre: optionalSafeText(120),
  objetivo: optionalEnum(objective),
  currentWeightKg: optionalNumber({ min: 20, max: 350 }),
  targetWeightKg: optionalNumber({ min: 20, max: 350 }),
  heightCm: optionalNumber({ min: 80, max: 250 }),
  age: optionalNumber({ min: 13, max: 120 }),
  dailyCalories: optionalNumber({ min: 800, max: 10000 }),
  trainingFrequency: optionalNumber({ min: 0, max: 14 }),
  desiredPace: optionalEnum(desiredPace),
  activityLevel: optionalEnum(activityLevel),
  gender: optionalEnum(gender),
  caloriesAutoCalculated: z.coerce.boolean().optional(),
  recommendedExercises: optionalSafeText(255)
};

export const schemas = {
  authRegisterBody: z.object({
    nombre: safeText(120),
    email,
    password: strongPassword
  }).strict(),

  authLoginBody: z.object({
    email,
    password
  }).strict(),

  authProfileBody: z.object(profileFields).strict(),

  onboardingBody: z.object({
    objetivo: objective,
    currentWeightKg: requiredNumber({ min: 20, max: 350 }),
    targetWeightKg: requiredNumber({ min: 20, max: 350 }),
    heightCm: requiredNumber({ min: 80, max: 250 }),
    age: requiredNumber({ min: 13, max: 120 }),
    gender,
    activityLevel,
    dailyCalories: optionalNumber({ min: 800, max: 10000 }),
    trainingFrequency: requiredNumber({ min: 0, max: 14 }),
    desiredPace
  }).strict(),

  changePasswordBody: z.object({
    currentPassword: password,
    newPassword: strongPassword
  }).strict(),

  forgotPasswordBody: z.object({
    email
  }).strict(),

  resetPasswordBody: z.object({
    token: z.string().min(32).max(256).regex(/^[A-Za-z0-9_-]+$/, 'Token invalido.'),
    password: strongPassword
  }).strict(),

  coachApplicationBody: z.object({
    bio: safeText(1200),
    specialties: safeText(300),
    experienceYears: optionalNumber({ min: 0, max: 80 }).default(0)
  }).strict(),

  coachAssignmentBody: z.object({
    coachId: positiveInt
  }).strict(),

  progressBody: z.object({
    weightKg: requiredNumber({ min: 20, max: 350 }),
    notes: optionalSafeText(500)
  }).strict(),

  idParams: z.object({
    id: positiveInt
  }).strict(),

  reviewCoachApplicationBody: z.object({
    decision,
    rejectionReason: optionalSafeText(500)
  }).strict(),

  calculateCaloriesBody: z.object({
    gender,
    weightKg: requiredNumber({ min: 20, max: 350 }).optional(),
    currentWeightKg: requiredNumber({ min: 20, max: 350 }).optional(),
    heightCm: requiredNumber({ min: 80, max: 250 }),
    age: requiredNumber({ min: 13, max: 120 }),
    activityLevel,
    objective: objective.optional(),
    objetivo: objective.optional(),
    targetWeightKg: optionalNumber({ min: 20, max: 350 }),
    dailyCalories: optionalNumber({ min: 800, max: 10000 }),
    trainingFrequency: optionalNumber({ min: 0, max: 14 }),
    desiredPace: desiredPace.optional()
  }).strict().refine((value) => value.weightKg || value.currentWeightKg, {
    message: 'Peso obligatorio.',
    path: ['weightKg']
  }),

  searchQuery: z.object({
    q: optionalSafeText(120),
    category: optionalSafeText(60),
    min: optionalNumber({ min: 0, max: 100000 }),
    max: optionalNumber({ min: 0, max: 100000 }),
    tags: z.union([optionalSafeText(200), z.array(optionalSafeText(60)).max(20)]).optional(),
    sort: sort.optional(),
    date_from: date.optional(),
    date_to: date.optional(),
    page: optionalNumber({ min: 1, max: 1000 }),
    limit: optionalNumber({ min: 1, max: 24 })
  }).strict(),

  slugParams: z.object({
    slug
  }).strict(),

  sessionCreateBody: z.object({
    clientId: positiveInt,
    topic: safeText(180),
    date,
    time,
    location: optionalSafeText(180).default('Online')
  }).strict(),

  chatBody: z.object({
    message: safeText(1000)
  }).strict()
};
