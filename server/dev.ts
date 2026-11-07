import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { ensureSchema, closePool } from './db.js';
import { createApp } from './index.js';

process.env.COOKIE_SECURE ??= 'false';
const port = Number(process.env.PORT ?? 3000);

await ensureSchema();
const vite = await createViteServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'spa',
});
const app = createApp({ serveStatic: false });
app.use(vite.middlewares);
app.use(async (request, response, next) => {
  if (request.path.startsWith('/api/')) return next();
  try {
    const template = await fs.readFile(path.resolve('index.html'), 'utf8');
    const html = await vite.transformIndexHtml(request.originalUrl, template);
    response.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  } catch (error) {
    vite.ssrFixStacktrace(error as Error);
    next(error);
  }
});
const server = app.listen(port, '0.0.0.0', () => console.log(`Preview Senário Clean em http://0.0.0.0:${port}`));
const stop = async () => { server.close(); await vite.close(); await closePool(); process.exit(0); };
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
