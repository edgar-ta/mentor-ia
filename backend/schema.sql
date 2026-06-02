CREATE DATABASE IF NOT EXISTS mentoria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mentoria;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS user_progress_logs;
DROP TABLE IF EXISTS coach_applications;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS mood;
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS clients;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('usuario', 'coach', 'administrador') NOT NULL DEFAULT 'usuario',
  avatar_url VARCHAR(255) NULL,
  email_verificado_at DATETIME NULL,
  ultimo_login_at DATETIME NULL,
  password_changed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
  usuario_id INT PRIMARY KEY,
  onboarding_completed TINYINT(1) NOT NULL DEFAULT 0,
  objetivo ENUM('bajar_peso', 'subir_peso', 'mantenerme', 'ganar_musculo') NULL,
  daily_calories INT NULL,
  calories_auto_calculated TINYINT(1) NOT NULL DEFAULT 0,
  training_frequency INT NULL,
  desired_pace ENUM('tranquilo', 'equilibrado', 'intenso') NULL,
  recommended_exercises VARCHAR(255) NULL,
  current_weight_kg DECIMAL(5,2) NULL,
  target_weight_kg DECIMAL(5,2) NULL,
  height_cm DECIMAL(5,2) NULL,
  age INT NULL,
  gender ENUM('masculino', 'femenino', 'otro') NULL,
  activity_level ENUM('sedentario', 'ligero', 'moderado', 'alto', 'atleta') NULL,
  assigned_coach_id INT NULL,
  coach_assigned_at DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_profiles_coach FOREIGN KEY (assigned_coach_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE coach_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  bio TEXT NOT NULL,
  specialties VARCHAR(255) NOT NULL,
  experience_years INT DEFAULT 0,
  status ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
  rejection_reason VARCHAR(255) NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_coach_applications_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_coach_applications_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE user_progress_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_progress_logs_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_user_progress_logs_usuario (usuario_id, created_at)
);

CREATE TABLE user_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  user_agent VARCHAR(255) NOT NULL,
  ip_address VARCHAR(80) NOT NULL,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_sessions_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_user_sessions_usuario (usuario_id),
  INDEX idx_user_sessions_expires (expires_at)
);

CREATE TABLE password_reset_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_password_reset_usuario (usuario_id),
  INDEX idx_password_reset_expires (expires_at)
);

CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  goal VARCHAR(200),
  status ENUM('activo','riesgo','inactivo') DEFAULT 'activo',
  next_session DATE,
  score INT DEFAULT 70,
  engagement INT DEFAULT 70,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  topic VARCHAR(200),
  date DATE,
  time TIME,
  status ENUM('programada','hecha','cancelada') DEFAULT 'programada',
  location VARCHAR(120),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(120) NOT NULL,
  value INT NOT NULL
);

CREATE TABLE campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  tag VARCHAR(80),
  image VARCHAR(255),
  cta VARCHAR(120)
);

CREATE TABLE reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  time_label VARCHAR(60) NOT NULL
);

CREATE TABLE mood (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  value INT NOT NULL
);

INSERT INTO clients (name, goal, status, next_session, score, engagement, avatar_url) VALUES
('Ana Torres', 'Bajar porcentaje de grasa', 'activo', '2026-04-22', 82, 88, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80'),
('Luis Perez', 'Ganar masa muscular', 'riesgo', '2026-04-23', 68, 70, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'),
('Marta Diaz', 'Mantener peso y definir', 'activo', '2026-04-24', 90, 92, 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80'),
('Carlos Vega', 'Resistencia y enfoque', 'inactivo', '2026-04-28', 74, 60, 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80');

INSERT INTO sessions (client_id, topic, date, time, status, location) VALUES
(1, 'Plan de fuerza personalizado', '2026-04-22', '10:00', 'programada', 'Zoom'),
(2, 'Rutina mental de alto rendimiento', '2026-04-23', '12:00', 'programada', 'Meet'),
(3, 'Seguimiento de habitos', '2026-04-24', '09:00', 'programada', 'Zoom'),
(4, 'Estrategia mensual', '2026-04-28', '16:00', 'programada', 'Presencial');

INSERT INTO goals (label, value) VALUES
('Programas activos', 18),
('Completados', 9),
('En riesgo', 5);

INSERT INTO campaigns (title, tag, image, cta) VALUES
('Run Black Pack', 'Precision', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80', 'Descubrir'),
('Strength Minimal', 'Coach Pick', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80', 'Entrenar'),
('Nutrition Reset', 'Fit Flow', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80', 'Ver plan');

INSERT INTO reminders (title, time_label) VALUES
('Actualizar peso semanal de Ana', 'Hace 1h'),
('Revisar progreso mensual de Luis', 'Hoy 18:00'),
('Enviar resumen nutricional', 'Manana');

INSERT INTO mood (label, value) VALUES
('En foco', 62),
('Neutros', 23),
('Fuera de ritmo', 15);
