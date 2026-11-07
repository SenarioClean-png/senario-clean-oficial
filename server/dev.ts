import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { ensureSchema, closePool } from './db.js';
import { createApp } from './index.js';

const port = Number(process.env.PORT ?? 3000);

await ensureSchema();
const vite = await createViteServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'spa',
});
const app = createApp({ serveStatic: false });
app.use(async (request, response, next) => {
  if (request.path !== '/' && !request.path.endsWith('.html')) return next();
  try {
    const template = await fs.readFile(path.resolve('index.html'), 'utf8');
    // O Preview usa um proxy HTTPS que não mantém o WebSocket HMR do Vite.
    // Os módulos continuam sendo transformados pelo middleware, mas o HTML
    // é servido sem injetar /@vite/client e sem tentar abrir esse WebSocket.
    response.status(200).set({ 'Content-Type': 'text/html' }).end(template);
  } catch (error) {
    next(error);
  }
});
app.use(vite.middlewares);
const server = app.listen(port, '0.0.0.0', () => console.log(`Preview Senário Clean em http://0.0.0.0:${port}`));
const stop = async () => { server.close(); await vite.close(); await closePool(); process.exit(0); };
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
