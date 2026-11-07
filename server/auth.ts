import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getPool, type AccountRow, type SessionRow } from './db.js';

export type AuthUser = { id: number; phone: string; role: 'customer' | 'admin' };

const SESSION_COOKIE = 'senario_session';
const CSRF_COOKIE = 'senario_csrf';
const sessionDays = 30;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  return digits;
}

export function validPhone(value: string) {
  return /^(?:[1-9]{2})9?\d{8}$/.test(value);
}

export function validPin(value: string) {
  return /^\d{6}$/.test(value);
}

function hashToken(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function cookieSecure() {
  return process.env.COOKIE_SECURE !== 'false';
}

function cookieFlags(httpOnly: boolean, maxAge?: number) {
  return `Path=/; ${httpOnly ? 'HttpOnly; ' : ''}SameSite=None; ${cookieSecure() ? 'Secure; ' : ''}${maxAge === undefined ? '' : `Max-Age=${maxAge};`}`;
}

function setCookie(response: Response, name: string, value: string, flags: string) {
  response.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; ${flags}`);
}

function clearCookie(response: Response, name: string) {
  response.append('Set-Cookie', `${name}=; ${cookieFlags(true, 0)}`);
}

function readCookie(request: Request, name: string) {
  const raw = request.headers.cookie ?? '';
  const match = raw.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

export function issueCsrf(response: Response, request: Request) {
  const current = readCookie(request, CSRF_COOKIE);
  const token = current || randomBytes(24).toString('hex');
  if (!current) setCookie(response, CSRF_COOKIE, token, cookieFlags(false, 60 * 60 * 24));
  return token;
}

export function requireCsrf(request: Request, response: Response) {
  const cookie = readCookie(request, CSRF_COOKIE);
  const header = request.header('x-csrf-token') ?? '';
  const cookieHash = createHash('sha256').update(cookie).digest();
  const headerHash = createHash('sha256').update(header).digest();
  if (!cookie || !header || !timingSafeEqual(cookieHash, headerHash)) {
    response.status(403).json({ error: 'Sessão de formulário expirada. Atualize a página e tente novamente.' });
    return false;
  }
  return true;
}

export function limited(key: string, max = 8) {
  const now = Date.now();
  const existing = attempts.get(key);
  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  existing.count += 1;
  return existing.count > max;
}

export async function createSession(userId: number, response: Response) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiry = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);
  await getPool().execute('INSERT INTO auth_sessions (token_hash, customer_id, expires_at) VALUES (?, ?, ?)', [tokenHash, userId, expiry]);
  setCookie(response, SESSION_COOKIE, token, cookieFlags(true, sessionDays * 24 * 60 * 60));
}

export async function currentUser(request: Request): Promise<AuthUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const [rows] = await getPool().execute<SessionRow[]>({
    sql: 'SELECT a.id, a.phone, a.role, s.token_hash FROM auth_sessions s JOIN customer_accounts a ON a.id = s.customer_id WHERE s.token_hash = ? AND s.expires_at > NOW() LIMIT 1',
    values: [hashToken(token)],
  });
  const row = rows[0];
  return row ? { id: row.id, phone: row.phone, role: row.role } : null;
}

export async function requireUser(request: Request, response: Response) {
  const user = await currentUser(request);
  if (!user) {
    response.status(401).json({ error: 'Entre na sua conta para continuar.' });
    return null;
  }
  return user;
}

export async function requireAdmin(request: Request, response: Response) {
  const user = await requireUser(request, response);
  if (!user) return null;
  if (user.role !== 'admin') {
    response.status(403).json({ error: 'Acesso restrito ao administrador.' });
    return null;
  }
  return user;
}

export async function logout(request: Request, response: Response) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await getPool().execute('DELETE FROM auth_sessions WHERE token_hash = ?', [hashToken(token)]);
  clearCookie(response, SESSION_COOKIE);
}

export async function passwordHash(pin: string) {
  return bcrypt.hash(pin, 12);
}

export async function passwordMatches(pin: string, hash: string) {
  return bcrypt.compare(pin, hash);
}
