import { Server } from 'socket.io';
import { LIMITS, validateName, validateColor, validateAvatar, validateRoomName, validateMessage } from './validation.js';
import { createRateLimiter } from './rateLimit.js';
import { DEFAULT_ROOM } from './db.js';

const TYPING_TTL = 3500;

/** Attach chat behaviour to an http server. `store` is the db wrapper. */
export function attachChat(httpServer, store, opts = {}) {
  const io = new Server(httpServer, { cors: { origin: true }, maxHttpBufferSize: 1e5 });
  const rate = opts.rate ?? { max: 6, windowMs: 5000 };

  /** socket.id -> { name, color, room, typingTimer, typing } */
  const users = new Map();
  const nameTaken = (name) =>
    [...users.values()].some((u) => u.name.toLowerCase() === name.toLowerCase());
  const inRoom = (room) => [...users.entries()].filter(([, u]) => u.room === room);
  const pub = (u) => ({ name: u.name, color: u.color, avatar: u.avatar });

  const roomsPayload = () =>
    store.listRooms().map((r) => ({ name: r.name, online: inRoom(r.name).length }));
  const broadcastRooms = () => io.emit('rooms', roomsPayload());
  const broadcastUsers = (room) =>
    io.to(`room:${room}`).emit('room:users', { room, users: inRoom(room).map(([, u]) => pub(u)) });
  const typingList = (room) => inRoom(room).filter(([, u]) => u.typing).map(([, u]) => u.name);
  const broadcastTyping = (room) =>
    io.to(`room:${room}`).emit('typing', { room, users: typingList(room) });
  const system = (room, text) =>
    io.to(`room:${room}`).emit('system', { room, text, ts: Date.now() });

  function setTyping(socket, u, on) {
    clearTimeout(u.typingTimer);
    const changed = u.typing !== on;
    u.typing = on;
    if (on) {
      u.typingTimer = setTimeout(() => {
        u.typing = false;
        if (u.room) broadcastTyping(u.room);
      }, TYPING_TTL);
    }
    if (changed && u.room) broadcastTyping(u.room);
  }

  function leaveRoom(socket, u) {
    if (!u.room) return;
    const old = u.room;
    setTyping(socket, u, false);
    socket.leave(`room:${old}`);
    u.room = null;
    system(old, `${u.name} left`);
    broadcastUsers(old);
    broadcastTyping(old);
  }

  io.on('connection', (socket) => {
    const limiter = createRateLimiter({ ...rate, now: opts.now });

    socket.on('join', (data, ack) => {
      ack = typeof ack === 'function' ? ack : () => {};
      if (users.has(socket.id)) return ack({ ok: false, error: 'Already joined' });
      const n = validateName(data?.name);
      if (!n.ok) return ack(n);
      const c = validateColor(data?.color);
      if (!c.ok) return ack(c);
      const av = validateAvatar(data?.avatar);
      if (!av.ok) return ack(av);
      if (nameTaken(n.value)) return ack({ ok: false, error: 'That name is taken right now' });
      users.set(socket.id, { name: n.value, color: c.value, avatar: av.value, room: null, typing: false });
      ack({ ok: true, user: { name: n.value, color: c.value, avatar: av.value }, rooms: roomsPayload() });
      broadcastRooms();
    });

    socket.on('room:join', (data, ack) => {
      ack = typeof ack === 'function' ? ack : () => {};
      const u = users.get(socket.id);
      if (!u) return ack({ ok: false, error: 'Join first' });
      const room = typeof data?.room === 'string' ? store.getRoom(data.room) : null;
      if (!room) return ack({ ok: false, error: 'No such room' });
      if (u.room === room.name) return ack({ ok: true, room: room.name, history: store.getHistory(room.id), users: inRoom(room.name).map(([, x]) => pub(x)) });
      leaveRoom(socket, u);
      u.room = room.name;
      socket.join(`room:${room.name}`);
      ack({
        ok: true,
        room: room.name,
        history: store.getHistory(room.id),
        users: inRoom(room.name).map(([, x]) => pub(x)),
        typing: typingList(room.name),
      });
      system(room.name, `${u.name} joined`);
      broadcastUsers(room.name);
      broadcastRooms();
    });

    socket.on('room:create', (data, ack) => {
      ack = typeof ack === 'function' ? ack : () => {};
      if (!users.has(socket.id)) return ack({ ok: false, error: 'Join first' });
      const v = validateRoomName(data?.name);
      if (!v.ok) return ack(v);
      const r = store.createRoom(v.value);
      if (!r.ok) return ack(r);
      ack({ ok: true, room: r.room.name });
      broadcastRooms();
    });

    socket.on('message:send', (data, ack) => {
      ack = typeof ack === 'function' ? ack : () => {};
      const u = users.get(socket.id);
      if (!u || !u.room) return ack({ ok: false, error: 'Join a room first' });
      const v = validateMessage(data?.text);
      if (!v.ok) return ack(v);
      if (!limiter.allow()) return ack({ ok: false, error: 'Slow down a little', rateLimited: true });
      const room = store.getRoom(u.room);
      const msg = store.addMessage({ roomId: room.id, name: u.name, color: u.color, avatar: u.avatar, text: v.value });
      setTyping(socket, u, false);
      io.to(`room:${u.room}`).emit('message', { room: u.room, ...msg });
      ack({ ok: true });
    });

    socket.on('typing', (data) => {
      const u = users.get(socket.id);
      if (!u || !u.room) return;
      setTyping(socket, u, !!data?.typing);
    });

    socket.on('disconnect', () => {
      const u = users.get(socket.id);
      if (!u) return;
      leaveRoom(socket, u);
      users.delete(socket.id);
      broadcastRooms();
    });
  });

  return io;
}

export { DEFAULT_ROOM, LIMITS };
