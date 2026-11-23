// Generates docs/screenshots/* and docs/chat-demo.webm against throwaway servers on ports 5195/5196.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { io as ioClient } from 'socket.io-client';
const Database = createRequire(import.meta.url)('better-sqlite3');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CP = 5195, SP = 5196, URL = `http://localhost:${CP}`;
const docs = path.join(root, 'docs'), shots = path.join(docs, 'screenshots');
fs.mkdirSync(shots, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parley-media-'));

const env = { ...process.env, CLIENT_PORT: String(CP), SERVER_PORT: String(SP), DB_PATH: path.join(tmp, 'm.db') };
const kids = [
  spawn('npm', ['run', 'start', '-w', 'server'], { cwd: root, env, stdio: 'ignore', detached: true }),
  spawn('npm', ['run', 'dev', '-w', 'client', '--', '--strictPort'], { cwd: root, env, stdio: 'ignore', detached: true }),
];
const stop = () => kids.forEach((k) => { try { process.kill(-k.pid, 'SIGTERM'); } catch {} });
process.on('exit', stop);
process.on('uncaughtException', (e) => { console.error(e); stop(); process.exit(1); });
process.on('unhandledRejection', (e) => { console.error(e); stop(); process.exit(1); });
for (let i = 0; i < 60; i++) { try { if ((await fetch(URL)).ok && (await fetch(`http://localhost:${SP}/api/health`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }

const browser = await chromium.launch();
// seed extra rooms (kept alive by a lurker) so the sidebar looks populated
const lurker = ioClient(`http://localhost:${SP}`);
const emit = (ev, d) => new Promise((r) => lurker.emit(ev, d, r));
await emit('join', { name: 'Lurker', color: '#b26bff' });
for (const r of ['Design', 'Music', 'Off-topic']) await emit('room:create', { name: r });
const wipe = () => { const d = new Database(env.DB_PATH); d.exec('DELETE FROM messages'); d.close(); };
const COLORS = { Tihu: '#3d8bff', Ruby: '#b26bff', Naira: '#2bd9a0', Aritra: '#ff5a36' };
const AV = { Tihu: 'sunny', Ruby: 'mochi', Naira: 'peach', Aritra: 'cosmo' };

async function join(ctx, name) {
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.getByLabel('Display name').fill(name);
  await page.getByTestId(`avatar-option-${AV[name]}`).click();
  await page.getByRole('radio', { name: `Colour ${COLORS[name]}` }).click();
  await page.getByRole('button', { name: /enter the room/i }).click();
  await page.getByTestId('room-title').waitFor();
  return page;
}
const say = async (page, text, wait = 450) => {
  const box = page.getByRole('textbox', { name: 'Message' });
  await box.fill(text); await box.press('Enter'); await page.waitForTimeout(wait);
};

const script = async (p) => {
  await say(p.Tihu, 'morning all ☀️ anyone tried the new build?');
  await say(p.Ruby, 'yep — the reconnect is so much smoother now');
  await say(p.Naira, 'just pulled it. the new profile pictures are adorable 😍');
  await say(p.Aritra, 'ha, mine looks suspiciously like me');
  await say(p.Tihu, 'wait till you try light mode');
  await say(p.Ruby, 'adding a "Design" room for the polish pass 🎨', 300);
  await say(p.Naira, 'I will bring snacks 🍪');
  await say(p.Aritra, 'perfect, see you all there!');
};

// ---------- screenshots (3 users) ----------
for (const [label, theme] of [['dark', 'dark'], ['light', 'light']]) {
  for (const [vw, vh, tag] of [[1280, 800, 'desktop'], [390, 844, 'mobile']]) {
    wipe();
    const ctxs = {};
    const pages = {};
    for (const n of Object.keys(COLORS)) {
      ctxs[n] = await browser.newContext({ viewport: n === 'Tihu' ? { width: vw, height: vh } : { width: 1280, height: 800 }, deviceScaleFactor: 2, colorScheme: theme, isMobile: false });
      await ctxs[n].addInitScript((t) => localStorage.setItem('parley-theme', t), theme);
      pages[n] = await join(ctxs[n], n);
    }
    await script(pages);
    await pages.Ruby.getByRole('textbox', { name: 'Message' }).pressSequentially('one sec, checking the', { delay: 15 });
    await pages.Tihu.waitForTimeout(500);
    await pages.Tihu.screenshot({ path: path.join(shots, `${tag}-${label}.png`) });
    if (tag === 'mobile') {
      await pages.Tihu.getByRole('button', { name: 'Open rooms' }).click();
      await pages.Tihu.waitForTimeout(400);
      await pages.Tihu.screenshot({ path: path.join(shots, `${tag}-${label}-rooms-drawer.png`) });
      await pages.Tihu.getByRole('button', { name: 'Close rooms' }).click();
      await pages.Tihu.waitForTimeout(300);
      await pages.Tihu.getByRole('button', { name: /Open people/ }).click();
      await pages.Tihu.waitForTimeout(400);
      await pages.Tihu.screenshot({ path: path.join(shots, `${tag}-${label}-people-drawer.png`) });
    }
    await Promise.all(Object.values(ctxs).map((c) => c.close()));
    // fresh DB state between runs is unnecessary: history just accumulates, newest 50 shown
  }
}

// ---------- recording (two users, ~20 s) ----------
wipe();
const vdir = path.join(tmp, 'video');
const rec = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: vdir, size: { width: 1280, height: 800 } }, colorScheme: 'dark' });
await rec.addInitScript(() => localStorage.setItem('parley-theme', 'dark'));
const mk = () => browser.newContext({ viewport: { width: 900, height: 700 }, colorScheme: 'dark' });
const [oc1, oc2, oc3] = [await mk(), await mk(), await mk()];
const A = await join(rec, 'Tihu');
await A.waitForTimeout(1000);
const B = await join(oc1, 'Ruby');
await A.waitForTimeout(700);
const C = await join(oc2, 'Naira');
await A.waitForTimeout(700);
const D = await join(oc3, 'Aritra');
await A.waitForTimeout(1200);
const type = async (page, text) => { const box = page.getByRole('textbox', { name: 'Message' }); await box.pressSequentially(text, { delay: 40 }); await page.waitForTimeout(300); await box.press('Enter'); };
await type(B, 'hey Tihu! is this thing on?'); await A.waitForTimeout(1000);
await type(A, 'loud and clear 👋 love the new pictures'); await A.waitForTimeout(900);
await type(C, 'mine is so cute 😍'); await A.waitForTimeout(900);
await A.getByRole('button', { name: 'Emoji' }).click(); await A.waitForTimeout(700);
await A.getByRole('button', { name: 'Insert 🔥' }).click(); await A.waitForTimeout(500);
await A.getByRole('textbox', { name: 'Message' }).press('Enter'); await A.waitForTimeout(1000);
await type(D, 'watch this — light mode time'); await A.waitForTimeout(900);
await A.getByRole('button', { name: /Switch to light theme/ }).click(); await A.waitForTimeout(1500);
await A.getByRole('button', { name: /Switch to dark theme/ }).click(); await A.waitForTimeout(900);
await A.getByLabel('Create room').click(); await A.getByLabel('New room name').fill('Design'); await A.waitForTimeout(500);
await A.getByLabel('New room name').press('Enter'); await A.waitForTimeout(1200);
await type(A, 'new room, who dis? 🎨'); await A.waitForTimeout(1200);
await rec.close(); await Promise.all([oc1, oc2, oc3].map((c) => c.close()));
const vid = fs.readdirSync(vdir).find((f) => f.endsWith('.webm'));
const raw = path.join(vdir, vid);
try {
  // 1.25x so the demo lands at ~20 s
  const { execFileSync } = await import('node:child_process');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-filter:v', 'setpts=PTS/1.25', '-an', '-c:v', 'libvpx-vp9', '-b:v', '1M', path.join(docs, 'chat-demo.webm')]);
} catch { fs.copyFileSync(raw, path.join(docs, 'chat-demo.webm')); }
await browser.close();
lurker.close();
stop();
console.log('media written to docs/');
