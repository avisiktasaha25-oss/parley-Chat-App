import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar.jsx';
import { Down } from './Icons.jsx';

const fmt = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' });
const time = (ts) => fmt.format(ts);
const GAP = 5 * 60 * 1000;

function group(items) {
  const out = [];
  for (const it of items) {
    if (it.kind === 'system') { out.push({ kind: 'system', ...it }); continue; }
    const last = out.at(-1);
    if (last && last.kind === 'group' && last.name === it.name && it.ts - last.msgs.at(-1).ts < GAP) last.msgs.push(it);
    else out.push({ kind: 'group', key: it.id, name: it.name, color: it.color, avatar: it.avatar, msgs: [it] });
  }
  return out;
}

export default function Messages({ items, me, room }) {
  const scroller = useRef(null);
  const pinned = useRef(true);
  const [unread, setUnread] = useState(0);
  const seen = useRef(0);
  const groups = useMemo(() => group(items), [items]);

  const toBottom = (smooth) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  // room switch: jump to bottom
  useLayoutEffect(() => { pinned.current = true; seen.current = items.length; setUnread(0); toBottom(false); }, [room]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const added = items.slice(seen.current);
    seen.current = items.length;
    if (!added.length) return;
    const mine = added.some((m) => m.kind === 'msg' && m.name === me.name);
    if (pinned.current || mine) { toBottom(!mine ? true : false); setUnread(0); }
    else setUnread((u) => u + added.filter((m) => m.kind === 'msg').length);
  }, [items, me.name]);

  useEffect(() => {
    const el = scroller.current;
    const onScroll = () => {
      pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (pinned.current) setUnread(0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const msgCount = items.filter((i) => i.kind === 'msg').length;

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scroller} className="scroll-thin h-full overflow-y-auto px-3 py-4 sm:px-6" role="log" aria-live="polite" aria-label={`Messages in ${room}`} data-testid="message-log">
        {msgCount === 0 && (
          <div className="mx-auto mt-16 max-w-xs text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border-[1.5px] border-line bg-panel2 text-3xl" style={{ boxShadow: '4px 4px 0 var(--shadow)' }} aria-hidden="true">👋</div>
            <p className="font-display text-2xl font-extrabold">It's quiet in #{room}</p>
            <p className="mt-1 text-sm text-muted">Be the first to say something. Seriously, someone has to.</p>
          </div>
        )}
        <div className="space-y-4">
          {groups.map((g) =>
            g.kind === 'system' ? (
              <p key={g.id} className="msg-in text-center font-mono text-[11px] uppercase tracking-wider text-muted">
                <span className="rounded-full border border-line/40 px-3 py-1">{g.text}</span>
              </p>
            ) : (
              <Group key={g.key} g={g} own={g.name === me.name} />
            )
          )}
        </div>
      </div>
      {unread > 0 && (
        <button onClick={() => { toBottom(true); setUnread(0); }}
          className="btn-hard msg-in absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border-[1.5px] border-line bg-accent px-4 py-2 text-sm font-bold text-accent-ink">
          <Down /> {unread} new message{unread > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}

function Group({ g, own }) {
  return (
    <div className={`flex items-end gap-2.5 ${own ? 'flex-row-reverse' : ''}`}>
      <div className="self-start pt-0.5"><Avatar name={g.name} color={g.color} seed={g.avatar} size={38} /></div>
      <div className={`flex min-w-0 max-w-[82%] flex-col gap-1 sm:max-w-[68%] ${own ? 'items-end' : 'items-start'}`}>
        <span className="px-1 font-display text-sm font-bold" style={own ? undefined : { color: 'var(--ink)' }}>
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: g.color }} aria-hidden="true" />
          {own ? 'You' : g.name}
        </span>
        {g.msgs.map((m, i) => (
          <div key={m.id} className="msg-in flex flex-col" style={{ alignItems: own ? 'flex-end' : 'flex-start' }}>
            <p
              className={`whitespace-pre-wrap break-words rounded-2xl border-[1.5px] border-line px-3.5 py-2 text-[15px] leading-relaxed ${
                own ? 'bg-accent text-accent-ink' : 'bg-panel text-ink'
              }`}
              style={{ boxShadow: '3px 3px 0 var(--shadow)', overflowWrap: 'anywhere' }}
            >
              {m.text}
            </p>
            {i === g.msgs.length - 1 && <time className="mt-1 px-1 font-mono text-[10.5px] text-muted" dateTime={new Date(m.ts).toISOString()}>{time(m.ts)}</time>}
          </div>
        ))}
      </div>
    </div>
  );
}
