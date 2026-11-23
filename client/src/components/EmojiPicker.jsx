import { useEffect, useRef } from 'react';
import { EMOJI } from '../constants.js';

export default function EmojiPicker({ onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const down = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('[data-emoji-toggle]')) onClose(); };
    const key = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [onClose]);
  return (
    <div ref={ref} role="dialog" aria-label="Emoji picker" className="card msg-in absolute bottom-full left-0 z-20 mb-3 w-[min(19rem,calc(100vw-2rem))] p-2">
      <div className="grid grid-cols-8 gap-0.5">
        {EMOJI.map((e) => (
          <button key={e} type="button" onClick={() => onPick(e)} aria-label={`Insert ${e}`}
            className="grid h-9 place-items-center rounded-lg text-xl transition-transform hover:scale-125 hover:bg-panel2">{e}</button>
        ))}
      </div>
    </div>
  );
}
