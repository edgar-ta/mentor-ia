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

-- ======================
-- TABLAS
-- ======================

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
  current_weight_kg DECIMAL(5,2) NULL,
  target_weight_kg DECIMAL(5,2) NULL,
  height_cm DECIMAL(5,2) NULL,
  age INT NULL,
  gender ENUM('masculino', 'femenino', 'otro') NULL,
  activity_level ENUM('sedentario', 'ligero', 'moderado', 'alto', 'atleta') NULL,
  assigned_coach_id INT NULL,
  coach_assigned_at DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_coach_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE coach_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  bio TEXT NOT NULL,
  specialties VARCHAR(255) NOT NULL,
  experience_years INT DEFAULT 0,
  status ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE user_progress_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE user_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  user_agent VARCHAR(255) NOT NULL,
  ip_address VARCHAR(80) NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  goal VARCHAR(200),
  status ENUM('activo','riesgo','inactivo') DEFAULT 'activo'
);

CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  topic VARCHAR(200),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(120),
  value INT
);

CREATE TABLE campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180)
);

CREATE TABLE reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200)
);

CREATE TABLE mood (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(80),
  value INT
);

-- ======================
-- INSERTS
-- ======================

-- 👤 Usuarios
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Juan Lopez', 'juan@example.com', '123456', 'usuario'),
('Sofia Ramirez', 'sofia@example.com', '123456', 'usuario'),
('Carlos Coach', 'coach@example.com', '123456', 'coach'),
('Admin Sistema', 'admin@example.com', '123456', 'administrador');

-- 🧾 Perfiles
INSERT INTO user_profiles (
  usuario_id, onboarding_completed, objetivo, daily_calories,
  training_frequency, desired_pace, current_weight_kg,
  target_weight_kg, height_cm, age, gender, activity_level, assigned_coach_id
) VALUES
(1,1,'bajar_peso',2000,3,'equilibrado',85,75,175,28,'masculino','moderado',3),
(2,1,'ganar_musculo',2500,4,'intenso',60,68,165,25,'femenino','alto',3);

-- 🧠 Coach
INSERT INTO coach_applications (usuario_id, bio, specialties, experience_years, status) VALUES
(3,'Entrenador profesional','pesas,nutricion',5,'aprobada');

-- 📊 Progreso
INSERT INTO user_progress_logs (usuario_id, weight_kg, notes) VALUES
(1,84.5,'Inicio'),
(1,83.2,'Progreso'),
(2,60.5,'Inicio');

-- 🔐 Sesiones
INSERT INTO user_sessions (usuario_id, token_hash, user_agent, ip_address, expires_at) VALUES
(1,SHA2('token1',256),'Chrome','127.0.0.1',NOW()+INTERVAL 1 DAY);

-- 🔁 Reset password
INSERT INTO password_reset_tokens (usuario_id, token_hash, expires_at) VALUES
(1,SHA2('reset1',256),NOW()+INTERVAL 1 HOUR);

-- 👥 Clients
INSERT INTO clients (name, goal, status) VALUES
('Ana Torres','Bajar grasa','activo'),
('Luis Perez','Ganar musculo','riesgo');

-- 📅 Sessions
INSERT INTO sessions (client_id, topic) VALUES
(1,'Plan inicial'),
(2,'Seguimiento');

-- 🎯 Goals
INSERT INTO goals (label,value) VALUES
('Activos',10);

-- 📢 Campaigns
INSERT INTO campaigns (title) VALUES
('Fitness Pro');

-- ⏰ Reminders
INSERT INTO reminders (title) VALUES
('Actualizar progreso');

-- 😊 Mood
INSERT INTO mood (label,value) VALUES
('En foco',70);