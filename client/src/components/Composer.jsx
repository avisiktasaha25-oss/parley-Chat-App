import { useEffect, useRef, useState } from 'react';
import { MAX_LEN } from '../constants.js';
import EmojiPicker from './EmojiPicker.jsx';
import { Send, Smile } from './Icons.jsx';

export default function Composer({ disabled, room, onSend, onTyping }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const lastTyping = useRef(0);
  const stopTimer = useRef(null);

  useEffect(() => () => clearTimeout(stopTimer.current), []);
  useEffect(() => { setText(''); setError(''); inputRef.current?.focus(); }, [room]);

  const notifyTyping = (value) => {
    clearTimeout(stopTimer.current);
    if (!value.trim()) { lastTyping.current = 0; onTyping(false); return; }
    const now = Date.now();
    if (now - lastTyping.current > 2000) { lastTyping.current = now; onTyping(true); }
    stopTimer.current = setTimeout(() => { lastTyping.current = 0; onTyping(false); }, 2500);
  };

  const change = (v) => { setText(v); setError(''); notifyTyping(v); };

  const submit = async (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || disabled || t.length > MAX_LEN) return;
    clearTimeout(stopTimer.current);
    lastTyping.current = 0;
    const res = await onSend(t);
    if (res?.ok) { setText(''); setEmoji(false); } else setError(res?.error || 'Could not send');
    inputRef.current?.focus();
  };

  const left = MAX_LEN - text.length;
  const over = left < 0;
  return (
    <form onSubmit={submit} className="relative border-t-[1.5px] border-line bg-panel p-3 sm:p-4">
      {emoji && <EmojiPicker onClose={() => setEmoji(false)} onPick={(e) => { change(text + e); inputRef.current?.focus(); }} />}
      <div className="flex items-end gap-2">
        <button type="button" data-emoji-toggle onClick={() => setEmoji((v) => !v)} aria-label="Emoji" aria-expanded={emoji}
          className="btn-hard grid h-11 w-11 shrink-0 place-items-center rounded-xl border-[1.5px] border-line bg-panel2 text-ink"><Smile /></button>
        <textarea
          ref={inputRef} rows={1} value={text} disabled={disabled}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e); } }}
          aria-invalid={over}
          placeholder={disabled ? 'Reconnecting…' : `Message #${room}`}
          aria-label="Message"
          className="scroll-thin h-11 max-h-32 min-h-11 flex-1 resize-none rounded-xl border-[1.5px] border-line bg-bg px-4 py-[10px] text-[15px] text-ink placeholder:text-muted/70 disabled:opacity-60"
          style={{ fieldSizing: 'content' }}
        />
        <button type="submit" disabled={disabled || !text.trim() || over} aria-label="Send message"
          className="btn-hard grid h-11 shrink-0 place-items-center rounded-xl border-[1.5px] border-line bg-accent px-4 font-bold text-accent-ink disabled:cursor-not-allowed disabled:opacity-50">
          <span className="flex items-center gap-1.5"><span className="hidden sm:inline">Send</span><Send /></span>
        </button>
      </div>
      <div className="mt-1.5 flex h-4 items-center justify-between px-1 font-mono text-[11px]">
        <span role="alert" className="font-medium text-danger">{over ? `Too long — remove ${-left} character${left === -1 ? '' : 's'} to send` : error}</span>
        {left < 200 && <span data-testid="char-count" className={left < 50 ? 'font-bold text-danger' : 'text-muted'}>{text.length}/{MAX_LEN}</span>}
      </div>
    </form>
  );
}
