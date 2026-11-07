import fs from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import type { ResultSetHeader } from 'mysql2';
import { z } from 'zod';
import { closePool, ensureSchema, getPool, type AccountRow } from './db.js';
import { createSession, currentUser, issueCsrf, limited, logout, normalizePhone, passwordHash, passwordMatches, requireAdmin, requireCsrf, requireUser, validPhone, validPin } from './auth.js';

const PORT = Number(process.env.PORT ?? 3000);
const ADMIN_PHONE = normalizePhone(process.env.ADMIN_PHONE ?? '5511927533791');
const distPath = path.resolve('dist');
const publicPath = path.resolve('public');

const authInput = z.object({ phone: z.string().min(1).max(30), pin: z.string().min(1).max(20) });
const quoteInput = z.object({ mode: z.enum(['home', 'company']), items: z.array(z.unknown()).min(1).max(50), zip: z.string().max(20), coupon: z.string().max(80), company: z.record(z.string()).optional(), message: z.string().max(20000) });

function clientIp(request: Request) {
  return request.ip || request.socket.remoteAddress || 'unknown';
}

export function createApp(options: { serveStatic?: boolean } = {}) {
  const app = express();
  const serveStatic = options.serveStatic ?? true;
  app.disable('x-powered-by');
  app.use(express.json({ limit: '120kb' }));

  app.get('/api/health', (_request, response) => response.json({ ok: true }));
  app.get('/api/auth/csrf', (request, response) => response.json({ csrfToken: issueCsrf(response, request) }));
  app.get('/api/auth/session', async (request, response) => {
    const user = await currentUser(request);
    response.json({ user: user ? { phone: user.phone, role: user.role } : null });
  });

  app.post('/api/auth/register', async (request, response) => {
    if (!requireCsrf(request, response)) return;
    const parsed = authInput.safeParse(request.body);
    const phone = parsed.success ? normalizePhone(parsed.data.phone) : '';
    const pin = parsed.success ? parsed.data.pin : '';
    if (!parsed.success || !validPhone(phone) || !validPin(pin) || limited(`register:${clientIp(request)}:${phone}`)) {
      response.status(400).json({ error: 'Informe um telefone válido e uma senha de exatamente 6 números.' });
      return;
    }
    const [existing] = await getPool().execute<AccountRow[]>('SELECT id FROM customer_accounts WHERE phone = ? LIMIT 1', [phone]);
    if (existing.length) {
      response.status(400).json({ error: 'Não foi possível concluir o cadastro. Confira os dados ou entre na sua conta.' });
      return;
    }
    const role = phone === ADMIN_PHONE ? 'admin' : 'customer';
    const hash = await passwordHash(pin);
    const [result] = await getPool().execute<ResultSetHeader>('INSERT INTO customer_accounts (phone, password_hash, role) VALUES (?, ?, ?)', [phone, hash, role]);
    await createSession(result.insertId, response);
    response.status(201).json({ user: { phone, role } });
  });

  app.post('/api/auth/login', async (request, response) => {
    if (!requireCsrf(request, response)) return;
    const parsed = authInput.safeParse(request.body);
    const phone = parsed.success ? normalizePhone(parsed.data.phone) : '';
    const pin = parsed.success ? parsed.data.pin : '';
    if (!parsed.success || !validPhone(phone) || !validPin(pin) || limited(`login:${clientIp(request)}:${phone}`)) {
      response.status(401).json({ error: 'Telefone ou senha inválidos.' });
      return;
    }
    const [rows] = await getPool().execute<AccountRow[]>('SELECT id, phone, password_hash, role FROM customer_accounts WHERE phone = ? LIMIT 1', [phone]);
    const account = rows[0];
    if (!account || !(await passwordMatches(pin, account.password_hash))) {
      response.status(401).json({ error: 'Telefone ou senha inválidos.' });
      return;
    }
    await createSession(account.id, response);
    response.json({ user: { phone: account.phone, role: account.role } });
  });

  app.post('/api/auth/logout', async (request, response) => {
    if (!requireCsrf(request, response)) return;
    await logout(request, response);
    response.json({ ok: true });
  });

  app.post('/api/quotes', async (request, response) => {
    if (!requireCsrf(request, response)) return;
    const user = await requireUser(request, response);
    if (!user) return;
    const parsed = quoteInput.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'Resumo de orçamento inválido.' });
      return;
    }
    await getPool().execute('INSERT INTO customer_quotes (customer_id, payload) VALUES (?, ?)', [user.id, JSON.stringify(parsed.data)]);
    response.status(201).json({ ok: true });
  });

  app.get('/api/admin/customers', async (request, response) => {
    const admin = await requireAdmin(request, response);
    if (!admin) return;
    const [rows] = await getPool().execute<(AccountRow & { quote_count: number; created_at: Date })[]>('SELECT a.phone, a.role, a.created_at, COUNT(q.id) AS quote_count FROM customer_accounts a LEFT JOIN customer_quotes q ON q.customer_id = a.id GROUP BY a.id, a.phone, a.role, a.created_at ORDER BY a.created_at DESC');
    response.json({ customers: rows.map((row) => ({ phone: row.phone, role: row.role, quoteCount: Number(row.quote_count), createdAt: row.created_at })) });
  });

  if (serveStatic) {
    if (fs.existsSync(distPath)) app.use(express.static(distPath, { index: false }));
    app.use(express.static(publicPath, { index: false }));
    app.use((request, response, next) => {
      if (request.path.startsWith('/api/')) return next();
      const index = path.join(distPath, 'index.html');
      if (fs.existsSync(index)) return response.sendFile(index);
      return next();
    });
    app.use((_request, response) => response.status(404).json({ error: 'Não encontrado.' }));
  }
  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('server/index.ts')) {
  ensureSchema().then(() => {
    const app = createApp();
    const server = app.listen(PORT, '0.0.0.0', () => console.log(`Senário Clean ouvindo na porta ${PORT}`));
    const stop = async () => { server.close(); await closePool(); process.exit(0); };
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
  }).catch((error) => { console.error(error); process.exit(1); });
}
