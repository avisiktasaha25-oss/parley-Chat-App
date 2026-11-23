import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { attachChat } from './chat.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export function createServer({ dbFile = ':memory:', rate, now } = {}) {
  const store = openDb(dbFile);
  const app = express();
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  const dist = path.resolve(here, '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  const server = http.createServer(app);
  const io = attachChat(server, store, { rate, now });
  return {
    server,
    io,
    store,
    close: () =>
      new Promise((resolve) => {
        io.close(() => {
          try { store.close(); } catch {}
          resolve();
        });
      }),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.SERVER_PORT || process.env.PORT || 5181);
  const dbFile = process.env.DB_PATH || path.resolve(here, '../data/chat.db');
  const { server } = createServer({ dbFile });
  server.listen(port, () => console.log(`[server] API + sockets  http://localhost:${port}`));
}
