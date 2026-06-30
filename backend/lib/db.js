import mysql from 'mysql2/promise';
import { getRequiredEnv } from './env.js';

export const pool = mysql.createPool({
  host: getRequiredEnv('DB_HOST'),
  user: getRequiredEnv('DB_USER'),
  password: getRequiredEnv('DB_PASS'),
  database: getRequiredEnv('DB_NAME'),
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});
