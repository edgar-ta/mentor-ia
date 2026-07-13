import mysql from 'mysql2/promise';
import { getRequiredEnv } from './env.js';

export const pool = mysql.createPool({
  host: getRequiredEnv('DB_HOST'),
  user: getRequiredEnv('DB_USER'),
  password: getRequiredEnv('DB_PASS'),
  database: getRequiredEnv('DB_NAME'),
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});
