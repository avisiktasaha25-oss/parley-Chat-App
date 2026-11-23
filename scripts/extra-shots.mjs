// Join screen + long-paragraph screenshots -> docs/screenshots/extra/. Throwaway servers on 5197/5198.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CP = 5197, SP = 5198, URL = `http://localhost:${CP}`;
const out = path.join(root, 'docs', 'screenshots', 'extra');
fs.mkdirSync(out, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parley-extra-'));
const env = { ...process.env, CLIENT_PORT: String(CP), SERVER_PORT: String(SP), DB_PATH: path.join(tmp, 'm.db') };
const kids = [
  spawn('npm', ['run', 'start', '-w', 'server'], { cwd: root, env, stdio: 'ignore', detached: true }),
  spawn('npm', ['run', 'dev', '-w', 'client', '--', '--strictPort'], { cwd: root, env, stdio: 'ignore', detached: true }),
];
const stop = () => kids.forEach((k) => { try { process.kill(-k.pid, 'SIGTERM'); } catch {} });
process.on('exit', stop);
for (let i = 0; i < 60; i++) { try { if ((await fetch(URL)).ok && (await fetch(`http://localhost:${SP}/api/health`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }

const browser = await chromium.launch();
const ctx = (vw, vh, theme) => browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, colorScheme: theme }).then(async (c) => { await c.addInitScript((t) => localStorage.setItem('parley-theme', t), theme); return c; });

// 1. join screen
for (const [tag, vw, vh, theme] of [['desktop-dark', 1280, 800, 'dark'], ['desktop-light', 1280, 800, 'light'], ['mobile-dark', 390, 844, 'dark']]) {
  const c = await ctx(vw, vh, theme); const p = await c.newPage();
  await p.goto(URL); await p.getByLabel('Display name').waitFor(); await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(out, `join-${tag}.png`) });
  await c.close();
}

// 2. long paragraphs
const RUBY = 'Okay, so I finally went through the whole onboarding flow end to end, and honestly there is a lot to unpack here. First, the join screen feels great, but when I pasted my staging link it kept stretching things: https://example.com/' + 'a-very-long-path-segment-with-no-spaces-'.repeat(3).slice(0, 120) + '\nSecond, the reconnect logic is much better than last week, although I still saw a brief flicker when the socket dropped while I was typing a longer reply. Third, the room list updates instantly, which is lovely, and the typing indicator is far less jumpy now. Finally, can we make sure that really long messages wrap nicely on small phones, keep their line breaks, and never push the page sideways? I would hate for someone to paste a giant stack trace and break the whole layout for everybody else in the room. Thanks, everyone!';
const TIHU = 'Totally agree with all of that. I tried the same thing on my phone this morning and the result was mostly fine, but I want to double check the edge cases before we call it done: a message with only emoji, a message that is exactly at the limit, and one that is a single unbroken string. If all three look good then I am happy to ship it, and we can move on to polishing the room drawer and the people panel, which still feel a little cramped on narrower screens.';
console.log('ruby length', RUBY.length, 'tihu length', TIHU.length);
const COLORS = { Tihu: '#3d8bff', Ruby: '#b26bff' };
const AV = { Tihu: 'sunny', Ruby: 'mochi' };
async function join(c, name, vp) {
  const p = await c.newPage(); await p.goto(URL);
  await p.getByLabel('Display name').fill(name);
  await p.getByTestId(`avatar-option-${AV[name]}`).click();
  await p.getByRole('radio', { name: `Colour ${COLORS[name]}` }).click();
  await p.getByRole('button', { name: /enter the room/i }).click();
  await p.getByTestId('room-title').waitFor(); return p;
}
const send = async (p, t) => { const b = p.getByRole('textbox', { name: 'Message' }); await b.fill(t); await b.press('Enter'); await p.waitForTimeout(500); };
const overflow = (p) => p.evaluate(() => ({ doc: document.documentElement.scrollWidth - innerWidth, log: (l => l.scrollWidth - l.clientWidth)(document.querySelector('[data-testid=message-log]')) }));

for (const [tag, vw, vh, theme] of [['long-desktop-dark', 1280, 800, 'dark'], ['long-mobile-light', 390, 844, 'light']]) {
  const cT = await ctx(vw, vh, theme), cR = await ctx(1280, 800, theme);
  const T = await join(cT, 'Tihu'), R = await join(cR, 'Ruby');
  await send(R, RUBY); await send(T, TIHU);
  await T.waitForTimeout(500);
  // scroll so Ruby's whole bubble (incl. the long URL) is in view on desktop; on mobile show the long word
  if (tag === 'long-mobile-light') await T.locator('p', { hasText: 'https://example.com/' }).first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await T.waitForTimeout(300);
  console.log(tag, 'overflow', JSON.stringify(await overflow(T)));
  await T.screenshot({ path: path.join(out, `${tag}.png`) });
  if (tag === 'long-mobile-light') {
    const b = T.getByRole('textbox', { name: 'Message' });
    await T.evaluate(() => document.querySelector('[data-testid=message-log]').scrollTo(0, 1e6));
    await b.fill('Pasting a giant log: ' + 'lorem ipsum dolor sit amet '.repeat(40)); // ~1100 chars
    await T.waitForTimeout(300);
    console.log('textarea len:', (await b.inputValue()).length);
    await T.screenshot({ path: path.join(out, 'over-limit-mobile.png') });
  }
  await cT.close(); await cR.close();
}
await browser.close(); stop(); console.log('done');
