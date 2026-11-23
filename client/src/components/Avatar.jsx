import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection';
import { STICKERS, STICKER_FACES, DEFAULT_STICKER } from '../constants.js';

// Any id that isn't a current sticker (e.g. an old "notionists" seed, or empty) maps
// deterministically onto a sticker, so it never renders broken.
export function stickerId(id) {
  if (STICKERS.includes(id)) return id;
  if (!id) return DEFAULT_STICKER;
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return STICKERS[h % STICKERS.length];
}

const cache = new Map();
// Offline sticker art (DiceBear "fun-emoji", CC BY 4.0) as an SVG data URI.
function dataUri(id) {
  let uri = cache.get(id);
  if (!uri) {
    uri = createAvatar(funEmoji, { seed: id, backgroundColor: ['transparent'], eyes: [STICKER_FACES[id].eyes], mouth: [STICKER_FACES[id].mouth] }).toDataUri();
    cache.set(id, uri);
  }
  return uri;
}

export default function Avatar({ name, color, seed, size = 36 }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => [...w][0]).join('').toUpperCase();
  const pad = Math.max(2, Math.round(size * 0.08));
  return (
    <span
      className="sticker inline-flex shrink-0 select-none items-center justify-center rounded-full"
      style={{ width: size, height: size, background: color, padding: pad }}
    >
      <img src={dataUri(stickerId(seed))} alt={initials} width={size} height={size} draggable="false" className="block h-full w-full" />
    </span>
  );
}
