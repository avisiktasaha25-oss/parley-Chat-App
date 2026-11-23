import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

let sysId = 0;

export function useChat() {
  const sockRef = useRef(null);
  const meRef = useRef(null);
  const roomRef = useRef(null);
  const [status, setStatus] = useState('connecting'); // connecting | connected | disconnected
  const [me, setMe] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(null);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState([]);
  const [joining, setJoining] = useState(false);

  const enterRoom = useCallback((name) => {
    const s = sockRef.current;
    return new Promise((resolve) => {
      s.emit('room:join', { room: name }, (res) => {
        if (res?.ok) {
          roomRef.current = res.room;
          setRoom(res.room);
          setItems(res.history.map((m) => ({ kind: 'msg', ...m })));
          setUsers(res.users);
          setTyping(res.typing || []);
        }
        resolve(res);
      });
    });
  }, []);

  useEffect(() => {
    const s = io({ transports: ['websocket', 'polling'] });
    sockRef.current = s;

    s.on('connect', () => {
      setStatus('connected');
      // after a drop the server has forgotten us: silently re-identify and re-enter the room
      if (meRef.current) {
        s.emit('join', meRef.current, (res) => {
          if (res?.ok) {
            setRooms(res.rooms);
            enterRoom(roomRef.current || 'General');
          } else {
            meRef.current = null;
            roomRef.current = null;
            setMe(null);
            setRoom(null);
          }
        });
      }
    });
    s.on('disconnect', () => setStatus('disconnected'));
    s.on('connect_error', () => setStatus((st) => (st === 'connected' ? st : 'disconnected')));
    s.on('rooms', setRooms);
    s.on('room:users', (p) => p.room === roomRef.current && setUsers(p.users));
    s.on('typing', (p) => p.room === roomRef.current && setTyping(p.users));
    s.on('message', (m) => {
      if (m.room !== roomRef.current) return;
      setItems((it) => [...it.slice(-299), { kind: 'msg', ...m }]);
    });
    s.on('system', (m) => {
      if (m.room !== roomRef.current) return;
      setItems((it) => [...it.slice(-299), { kind: 'system', id: `s${++sysId}`, text: m.text, ts: m.ts }]);
    });
    return () => s.close();
  }, [enterRoom]);

  const join = useCallback(
    async (name, color, avatar) => {
      setJoining(true);
      const s = sockRef.current;
      const res = await new Promise((r) => s.emit('join', { name, color, avatar }, r));
      if (!res?.ok) {
        setJoining(false);
        return res || { ok: false, error: 'No response from server' };
      }
      meRef.current = { name: res.user.name, color: res.user.color, avatar: res.user.avatar };
      setMe(res.user);
      setRooms(res.rooms);
      await enterRoom('General');
      setJoining(false);
      return { ok: true };
    },
    [enterRoom]
  );

  const switchRoom = useCallback((name) => name !== roomRef.current && enterRoom(name), [enterRoom]);
  const createRoom = useCallback(
    async (name) => {
      const res = await new Promise((r) => sockRef.current.emit('room:create', { name }, r));
      if (res?.ok) await enterRoom(res.room);
      return res;
    },
    [enterRoom]
  );
  const send = useCallback(
    (text) => new Promise((r) => sockRef.current.emit('message:send', { text }, r)),
    []
  );
  const sendTyping = useCallback((on) => sockRef.current?.emit('typing', { typing: on }), []);

  return { status, me, rooms, room, items, users, typing, joining, join, switchRoom, createRoom, send, sendTyping };
}
