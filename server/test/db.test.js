import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb, DEFAULT_ROOM } from '../src/db.js';
import { LIMITS } from '../src/validation.js';

test('seeds General and is idempotent', () => {
  const db = openDb();
  assert.deepEqual(db.listRooms().map((r) => r.name), [DEFAULT_ROOM]);
  db.close();
});

test('rooms: unique (case-insensitive) and capped at 30', () => {
  const db = openDb();
  assert.equal(db.createRoom('Dev').ok, true);
  assert.equal(db.createRoom('dev').ok, false);
  for (let i = 0; db.listRooms().length < LIMITS.MAX_ROOMS; i++) assert.ok(db.createRoom(`r${i}`).ok);
  assert.equal(db.createRoom('one more').ok, false);
  db.close();
});

test('history returns last 50 oldest-first, per room', () => {
  const db = openDb();
  const g = db.getRoom(DEFAULT_ROOM).id;
  const other = db.createRoom('Other').room.id;
  for (let i = 1; i <= 60; i++) db.addMessage({ roomId: g, name: 'a', color: '#fff', text: `m${i}`, ts: i });
  db.addMessage({ roomId: other, name: 'b', color: '#fff', text: 'elsewhere' });
  const h = db.getHistory(g);
  assert.equal(h.length, 50);
  assert.equal(h[0].text, 'm11');
  assert.equal(h.at(-1).text, 'm60');
  assert.equal(db.getHistory(other).length, 1);
  db.close();
});
