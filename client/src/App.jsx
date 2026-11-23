import { useEffect, useState } from 'react';
import { useChat } from './useChat.js';
import Avatar from './components/Avatar.jsx';
import JoinScreen from './components/JoinScreen.jsx';
import Sidebar from './components/Sidebar.jsx';
import UsersPanel from './components/UsersPanel.jsx';
import Messages from './components/Messages.jsx';
import Composer from './components/Composer.jsx';
import TypingIndicator from './components/TypingIndicator.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { Menu, Users, Hash } from './components/Icons.jsx';

export default function App() {
  const chat = useChat();
  const [drawer, setDrawer] = useState(null); // 'rooms' | 'users' | null

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && setDrawer(null);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  if (!chat.me || !chat.room) {
    return <JoinScreen onJoin={chat.join} joining={chat.joining} status={chat.status} />;
  }

  const { status, me, rooms, room, items, users, typing } = chat;
  const others = typing.filter((n) => n !== me.name);
  const offline = status !== 'connected';
  const close = () => setDrawer(null);

  // z-index plan: pill 10 · emoji 20 · backdrop 30 · drawers 40
  const ASIDE_BASE = 'fixed inset-y-0 z-40 w-[84%] max-w-[300px] bg-panel transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 lg:transition-none border-line';
  const SIDE = {
    left: { cls: 'left-0 border-r-[1.5px]', closed: '-translate-x-full' },
    right: { cls: 'right-0 border-l-[1.5px]', closed: 'translate-x-full' },
  };
  const aside = (side, open) => `${ASIDE_BASE} ${SIDE[side].cls} ${open ? 'translate-x-0' : SIDE[side].closed}`;

  return (
    <div className="mx-auto flex h-full max-w-[1500px] p-0 lg:p-5">
      <div className="card relative flex h-full w-full overflow-hidden rounded-none border-0 lg:rounded-[22px] lg:border-[1.5px]" style={{ boxShadow: undefined }}>
        {drawer && <div className="fixed inset-0 z-30 bg-black/55 lg:hidden" onClick={close} aria-hidden="true" data-testid="backdrop" />}

        <aside className={aside('left', drawer === 'rooms')} aria-label="Rooms sidebar" data-testid="rooms-drawer">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 border-b-[1.5px] border-line p-4">
              <span className="grid h-9 w-9 place-items-center rounded-xl border-[1.5px] border-line bg-accent text-accent-ink">
                <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8h18v12H15l-5 4v-4H7z" fill="currentColor" /></svg>
              </span>
              <span className="font-display text-2xl font-extrabold tracking-tight">parley</span>
            </div>
            <div className="min-h-0 flex-1">
              <Sidebar rooms={rooms} room={room} onSwitch={chat.switchRoom} onCreate={chat.createRoom} onClose={close} />
            </div>
            <div className="flex items-center gap-2.5 border-t-[1.5px] border-line p-3">
              <MeChip me={me} />
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col" aria-label="Chat">
          <header className="flex items-center gap-2 border-b-[1.5px] border-line px-3 py-3 sm:px-5">
            <button onClick={() => setDrawer('rooms')} aria-label="Open rooms" className="grid h-10 w-10 place-items-center rounded-xl border-[1.5px] border-line bg-panel2 lg:hidden"><Menu /></button>
            <h1 className="flex min-w-0 flex-1 items-center gap-1.5 truncate font-display text-xl font-extrabold sm:text-2xl" data-testid="room-title">
              <Hash /> <span className="truncate">{room}</span>
            </h1>
            <span className="hidden items-center gap-2 font-mono text-xs text-muted sm:flex"><span className="flex -space-x-2" data-testid="header-avatars">{users.slice(0,5).map((u) => <Avatar key={u.name} name={u.name} color={u.color} seed={u.avatar} size={26} />)}</span><span className="h-2 w-2 rounded-full" style={{ background: offline ? 'var(--danger)' : '#2bd9a0' }} />{users.length} online</span>
            <button onClick={() => setDrawer('users')} aria-label={`Open people (${users.length} online)`} className="relative grid h-10 w-10 place-items-center rounded-xl border-[1.5px] border-line bg-panel2 lg:hidden">
              <Users />
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-[1.5px] border-line bg-accent px-1 font-mono text-[10px] font-medium text-accent-ink">{users.length}</span>
            </button>
          </header>

          {offline && (
            <div role="status" className="flex items-center gap-2.5 border-b-[1.5px] border-line bg-danger px-4 py-2 text-sm font-semibold text-white" data-testid="offline-banner">
              <span className="spinner h-4 w-4 rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              Connection lost — reconnecting…
            </div>
          )}

          <Messages items={items} me={me} room={room} />
          <TypingIndicator names={others} />
          <Composer disabled={offline} room={room} onSend={chat.send} onTyping={chat.sendTyping} />
        </section>

        <aside className={aside('right', drawer === 'users')} aria-label="People">
          <UsersPanel users={users} me={me} onClose={close} />
        </aside>
      </div>
    </div>
  );
}

function MeChip({ me }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <Avatar name={me.name} color={me.color} seed={me.avatar} size={40} />
      <div className="min-w-0 leading-tight">
        <p className="truncate font-semibold">{me.name}</p>
        <p className="font-mono text-[11px] text-muted">signed in</p>
      </div>
    </div>
  );
}
