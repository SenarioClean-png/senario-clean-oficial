import fs from 'node:fs/promises';
import path from 'node:path';
import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';

let pool: Pool | undefined;

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL ?? process.env.DRIZZLE_DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL não configurada.');
  return value;
}

export function getPool() {
  if (!pool) pool = mysql.createPool({ uri: getDatabaseUrl(), connectionLimit: 8, waitForConnections: true, namedPlaceholders: true });
  return pool;
}

export async function ensureSchema() {
  const sql = await fs.readFile(path.resolve('migrations/001_init.sql'), 'utf8');
  const connection = await getPool().getConnection();
  try {
    for (const statement of sql.split(';').map((part) => part.trim()).filter(Boolean)) {
      await connection.query(statement);
    }
  } finally {
    connection.release();
  }
}

export async function closePool() {
  if (pool) await pool.end();
  pool = undefined;
}

export type AccountRow = RowDataPacket & {
  id: number;
  phone: string;
  password_hash: string;
  role: 'customer' | 'admin';
};

export type SessionRow = RowDataPacket & { id: number; phone: string; role: 'customer' | 'admin'; token_hash: string };
