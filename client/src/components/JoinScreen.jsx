import { useState } from 'react';
import { COLORS, STICKERS } from '../constants.js';
import { load, save } from '../storage.js';
import Avatar from './Avatar.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function JoinScreen({ onJoin, joining, status }) {
  const [name, setName] = useState(() => load('parley-name', ''));
  const [color, setColor] = useState(() => {
    const c = load('parley-color');
    return COLORS.includes(c) ? c : COLORS[Math.floor(Math.random() * COLORS.length)];
  });
  const [avatar, setAvatar] = useState(() => {
    const a = load('parley-avatar');
    return STICKERS.includes(a) ? a : STICKERS[Math.floor(Math.random() * STICKERS.length)];
  });
  const [error, setError] = useState('');
  const trimmed = name.trim().replace(/\s+/g, ' ');
  const valid = trimmed.length >= 2 && trimmed.length <= 24;
  const offline = status !== 'connected';

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || joining || offline) return;
    setError('');
    const res = await onJoin(trimmed, color, avatar);
    if (!res.ok) setError(res.error);
    else { save('parley-name', trimmed); save('parley-color', color); save('parley-avatar', avatar); }
  };

  return (
    <main className="relative grid min-h-full place-items-center px-4 py-10">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border-[1.5px] border-line bg-accent text-accent-ink" style={{ boxShadow: '4px 4px 0 var(--shadow)' }}>
            <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8h18v12H15l-5 4v-4H7z" fill="currentColor" /></svg>
          </span>
          <span className="font-display text-4xl font-extrabold tracking-tight">parley</span>
        </div>
        <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
          Pull up a chair.<br /><span className="text-accent">Say something.</span>
        </h1>
        <p className="mt-4 max-w-sm text-[15px] text-muted">Live rooms for you and whoever else is around. No passwords — just pick a name and a colour.</p>

        <form onSubmit={submit} className="card mt-8 p-5">
          <label htmlFor="name" className="font-mono text-xs uppercase tracking-widest text-muted">Display name</label>
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={trimmed || '?'} color={color} seed={avatar} size={48} />
            <input
              id="name" autoFocus autoComplete="off" maxLength={24} value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Tihu"
              className="h-12 w-full rounded-xl border-[1.5px] border-line bg-bg px-4 text-lg font-medium text-ink placeholder:text-muted/70"
            />
          </div>
          <fieldset className="mt-5">
            <legend className="font-mono text-xs uppercase tracking-widest text-muted">Your colour</legend>
            <div className="mt-2 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Avatar colour">
              {COLORS.map((c) => (
                <button
                  key={c} type="button" role="radio" aria-checked={c === color} aria-label={`Colour ${c}`}
                  onClick={() => setColor(c)}
                  className="h-9 w-9 rounded-xl border-[1.5px] border-line transition-transform hover:-translate-y-0.5"
                  style={{ background: c, boxShadow: c === color ? '0 0 0 3px var(--panel), 0 0 0 5px var(--ink)' : 'none' }}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="font-mono text-xs uppercase tracking-widest text-muted">Your picture</legend>
            <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-8 sm:gap-2.5" role="radiogroup" aria-label="Avatar picture">
              {STICKERS.map((s) => (
                <button
                  key={s} type="button" role="radio" aria-checked={s === avatar} aria-label={`Avatar ${s}`} data-testid={`avatar-option-${s}`}
                  onClick={() => setAvatar(s)}
                  className="rounded-full transition-transform hover:-translate-y-0.5"
                  style={{ boxShadow: s === avatar ? '0 0 0 3px var(--panel), 0 0 0 5px var(--ink)' : 'none' }}
                >
                  <Avatar name={trimmed || '?'} color={color} seed={s} size={42} />
                </button>
              ))}
            </div>
          </fieldset>
          <p role="alert" className="mt-4 min-h-5 text-sm font-medium text-danger">{error}</p>
          <button
            type="submit" disabled={!valid || joining || offline}
            className="btn-hard mt-1 h-12 w-full rounded-xl border-[1.5px] border-line bg-accent text-base font-bold text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {offline ? (status === 'connecting' ? 'Connecting…' : 'Server unreachable — retrying…') : joining ? 'Joining…' : 'Enter the room →'}
          </button>
        </form>
      </div>
    </main>
  );
}
