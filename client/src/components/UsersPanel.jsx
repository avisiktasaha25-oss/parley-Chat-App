import Avatar from './Avatar.jsx';
import { X } from './Icons.jsx';

export default function UsersPanel({ users, me, onClose }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Online · {users.length}</h2>
        {onClose && <button onClick={onClose} aria-label="Close people" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-panel2 lg:hidden"><X /></button>}
      </div>
      <ul className="scroll-thin mt-3 flex-1 space-y-1 overflow-y-auto" aria-label="Online users" data-testid="online-list">
        {users.map((u) => (
          <li key={u.name} className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="relative">
              <Avatar name={u.name} color={u.color} seed={u.avatar} size={34} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-panel" style={{ background: '#2bd9a0' }} />
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">{u.name}</span>
            {u.name === me?.name && <span className="rounded-md bg-panel2 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted">you</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
