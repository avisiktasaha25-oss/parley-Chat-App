import { useState } from 'react';
import { Hash, Plus, X } from './Icons.jsx';

export default function Sidebar({ rooms, room, onSwitch, onCreate, onClose }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const res = await onCreate(name);
    if (res?.ok) { setAdding(false); setName(''); setError(''); onClose?.(); }
    else setError(res?.error || 'Could not create room');
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Rooms · {rooms.length}</h2>
        <div className="flex gap-1">
          <button onClick={() => { setAdding((a) => !a); setError(''); }} aria-label="Create room" aria-expanded={adding}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink hover:bg-panel2"><Plus /></button>
          {onClose && <button onClick={onClose} aria-label="Close rooms" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-panel2 lg:hidden"><X /></button>}
        </div>
      </div>

      {adding && (
        <form onSubmit={submit} className="mt-3">
          <input autoFocus value={name} maxLength={24} onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="New room name" aria-label="New room name"
            className="h-10 w-full rounded-lg border-[1.5px] border-line bg-bg px-3 text-sm placeholder:text-muted/70" />
          <p role="alert" className="mt-1 min-h-4 text-xs font-medium text-danger">{error}</p>
        </form>
      )}

      <ul className="scroll-thin mt-3 flex-1 space-y-1.5 overflow-y-auto pr-1" aria-label="Rooms">
        {rooms.map((r) => {
          const active = r.name === room;
          return (
            <li key={r.name}>
              <button
                onClick={() => { onSwitch(r.name); onClose?.(); }}
                aria-current={active ? 'true' : undefined}
                className={`flex w-full items-center gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-left font-semibold transition-colors ${
                  active ? 'border-line bg-accent text-accent-ink' : 'border-transparent text-ink hover:bg-panel2'
                }`}
                style={active ? { boxShadow: '3px 3px 0 var(--shadow)' } : undefined}
              >
                <Hash />
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${active ? 'bg-black/15' : 'bg-panel2 text-muted'}`} title={`${r.online} online`}>
                  <span aria-hidden="true">● </span>{r.online}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
