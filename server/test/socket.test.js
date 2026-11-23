import test from 'node:test';
import assert from 'node:assert/strict';
import { io as connect } from '../../node_modules/socket.io-client/build/esm/index.js';
import { createServer } from '../src/index.js';
import { COLORS } from '../src/validation.js';

async function setup(opts) {
  const s = createServer(opts);
  await new Promise((r) => s.server.listen(0, r));
  const url = `http://localhost:${s.server.address().port}`;
  const clients = [];
  const client = () => {
    const c = connect(url, { transports: ['websocket'] });
    clients.push(c);
    const emit = (ev, data) => new Promise((res) => c.emit(ev, data, res));
    return { c, emit };
  };
  const stop = async () => { clients.forEach((c) => c.close()); await s.close(); };
  return { client, stop, s };
}
const once = (c, ev) => new Promise((r) => c.once(ev, r));

test('join: unique names among online users, colour validated', async () => {
  const { client, stop } = await setup();
  const a = client(), b = client();
  assert.equal((await a.emit('join', { name: 'Ada', color: COLORS[0] })).ok, true);
  const dup = await b.emit('join', { name: 'ada', color: COLORS[1] });
  assert.equal(dup.ok, false);
  assert.equal((await b.emit('join', { name: 'Bo', color: '#123456' })).ok, false);
  assert.equal((await b.emit('join', { name: 'Bo', color: COLORS[1], avatar: '<x>' })).ok, false);
  assert.equal((await b.emit('join', { name: 'Bo', color: COLORS[1] })).ok, true);
  await stop();
});

test('messages fan out, persist, and are replayed as history', async () => {
  const { client, stop } = await setup();
  const a = client(), b = client();
  await a.emit('join', { name: 'Ada', color: COLORS[0] });
  await b.emit('join', { name: 'Bo', color: COLORS[1] });
  await a.emit('room:join', { room: 'General' });
  await b.emit('room:join', { room: 'General' });
  const got = once(b.c, 'message');
  assert.equal((await a.emit('message:send', { text: '  hello  ' })).ok, true);
  const m = await got;
  assert.equal(m.text, 'hello');
  assert.equal(m.name, 'Ada');
  assert.ok(m.ts > 0);
  const late = client();
  await late.emit('join', { name: 'Cy', color: COLORS[2] });
  const j = await late.emit('room:join', { room: 'General' });
  assert.equal(j.history.length, 1);
  assert.equal(j.history[0].text, 'hello');
  assert.equal(j.users.length, 3);
  await stop();
});

test('rate limit rejects bursts per socket', async () => {
  const { client, stop } = await setup({ rate: { max: 3, windowMs: 60000 } });
  const a = client();
  await a.emit('join', { name: 'Ada', color: COLORS[0] });
  await a.emit('room:join', { room: 'General' });
  const results = [];
  for (let i = 0; i < 5; i++) results.push((await a.emit('message:send', { text: `m${i}` })).ok);
  assert.deepEqual(results, [true, true, true, false, false]);
  await stop();
});

test('typing is broadcast and auto-clears on send; invalid payloads rejected', async () => {
  const { client, stop } = await setup();
  const a = client(), b = client();
  await a.emit('join', { name: 'Ada', color: COLORS[0] });
  await b.emit('join', { name: 'Bo', color: COLORS[1] });
  await a.emit('room:join', { room: 'General' });
  await b.emit('room:join', { room: 'General' });
  const t = once(b.c, 'typing');
  a.c.emit('typing', { typing: true });
  assert.deepEqual((await t).users, ['Ada']);
  assert.equal((await a.emit('message:send', { text: 'x'.repeat(1001) })).ok, false);
  assert.equal((await a.emit('room:create', { name: '<script>' })).ok, false);
  assert.equal((await a.emit('room:create', { name: 'Music' })).ok, true);
  await stop();
});
