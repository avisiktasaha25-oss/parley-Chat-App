export const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 24,
  ROOM_MIN: 2,
  ROOM_MAX: 24,
  MAX_ROOMS: 30,
  MESSAGE_MAX: 1000,
  HISTORY: 50,
};

export const COLORS = [
  '#ff5a36', '#ffb800', '#2bd9a0', '#3d8bff',
  '#b26bff', '#ff4fa3', '#19c6d9', '#8bd62b',
];

// Collapse whitespace runs, strip control characters.
const clean = (s) =>
  String(s)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function validateName(raw) {
  if (typeof raw !== 'string') return { ok: false, error: 'Name must be text' };
  const name = clean(raw);
  if (name.length < LIMITS.NAME_MIN || name.length > LIMITS.NAME_MAX)
    return { ok: false, error: `Name must be ${LIMITS.NAME_MIN}–${LIMITS.NAME_MAX} characters` };
  return { ok: true, value: name };
}

export function validateColor(raw) {
  if (typeof raw === 'string' && COLORS.includes(raw.toLowerCase()))
    return { ok: true, value: raw.toLowerCase() };
  return { ok: false, error: 'Pick one of the avatar colours' };
}

export function validateAvatar(raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: '' };
  if (typeof raw === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(raw)) return { ok: true, value: raw };
  return { ok: false, error: 'Invalid avatar' };
}

export function validateRoomName(raw) {
  if (typeof raw !== 'string') return { ok: false, error: 'Room name must be text' };
  const name = clean(raw);
  if (name.length < LIMITS.ROOM_MIN || name.length > LIMITS.ROOM_MAX)
    return { ok: false, error: `Room name must be ${LIMITS.ROOM_MIN}–${LIMITS.ROOM_MAX} characters` };
  if (!/^[\p{L}\p{N} _\-]+$/u.test(name))
    return { ok: false, error: 'Room names may use letters, numbers, spaces, - and _' };
  return { ok: true, value: name };
}

export function validateMessage(raw) {
  if (typeof raw !== 'string') return { ok: false, error: 'Message must be text' };
  // keep newlines, drop other control chars, trim edges
  const text = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!text) return { ok: false, error: 'Message is empty' };
  if (text.length > LIMITS.MESSAGE_MAX)
    return { ok: false, error: `Message is too long (max ${LIMITS.MESSAGE_MAX})` };
  return { ok: true, value: text };
}
