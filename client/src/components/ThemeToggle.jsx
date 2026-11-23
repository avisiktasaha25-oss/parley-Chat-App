import { useEffect, useState } from 'react';
import { load, save } from '../storage.js';
import { Sun, Moon } from './Icons.jsx';

export default function ThemeToggle() {
  // seed from a constant; apply the real value after mount
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === 'light' || t === 'dark') setTheme(t);
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    save('parley-theme', next);
  };
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title="Toggle theme"
      className="btn-hard grid h-10 w-10 place-items-center rounded-xl border-[1.5px] border-line bg-panel2 text-ink"
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </button>
  );
}
