import { closePool, ensureSchema } from './db.js';

try {
  await ensureSchema();
  console.log('Schema do Senário Clean atualizado.');
} finally {
  await closePool();
}
