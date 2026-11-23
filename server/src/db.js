import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { LIMITS } from './validation.js';

export const DEFAULT_ROOM = 'General';

export function openDb(file = ':memory:') {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      user_name TEXT NOT NULL,
      color TEXT NOT NULL,
      text TEXT NOT NULL,
      ts INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, id);
  `);

  if (!db.prepare('PRAGMA table_info(messages)').all().some((c) => c.name === 'avatar'))
    db.exec("ALTER TABLE messages ADD COLUMN avatar TEXT NOT NULL DEFAULT ''");

  const q = {
    insertRoom: db.prepare('INSERT INTO rooms (name, created_at) VALUES (?, ?)'),
    roomByName: db.prepare('SELECT id, name FROM rooms WHERE name = ?'),
    allRooms: db.prepare('SELECT id, name FROM rooms ORDER BY id'),
    countRooms: db.prepare('SELECT COUNT(*) AS n FROM rooms'),
    insertMsg: db.prepare(
      'INSERT INTO messages (room_id, user_name, color, avatar, text, ts) VALUES (?, ?, ?, ?, ?, ?)'
    ),
    history: db.prepare(
      `SELECT id, user_name AS name, color, avatar, text, ts FROM messages
       WHERE room_id = ? ORDER BY id DESC LIMIT ?`
    ),
  };

  if (!q.roomByName.get(DEFAULT_ROOM)) q.insertRoom.run(DEFAULT_ROOM, Date.now());

  return {
    raw: db,
    close: () => db.close(),
    listRooms: () => q.allRooms.all(),
    getRoom: (name) => q.roomByName.get(name),
    createRoom(name) {
      if (q.countRooms.get().n >= LIMITS.MAX_ROOMS)
        return { ok: false, error: `Room limit reached (${LIMITS.MAX_ROOMS})` };
      if (q.roomByName.get(name)) return { ok: false, error: 'That room already exists' };
      q.insertRoom.run(name, Date.now());
      return { ok: true, room: q.roomByName.get(name) };
    },
    addMessage({ roomId, name, color, avatar = '', text, ts = Date.now() }) {
      const info = q.insertMsg.run(roomId, name, color, avatar, text, ts);
      return { id: Number(info.lastInsertRowid), name, color, avatar, text, ts };
    },
    /** last N messages, oldest first */
    getHistory(roomId, limit = LIMITS.HISTORY) {
      return q.history.all(roomId, limit).reverse();
    },
  };
}
