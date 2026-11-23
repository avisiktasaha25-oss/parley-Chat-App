// Starts API server + Vite client on free ports and prints the URLs.
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const isFree = (port) =>
  new Promise((resolve) => {
    const s = net.createServer().once('error', () => resolve(false)).once('listening', () => s.close(() => resolve(true)));
    s.listen(port);
  });
async function freePort(start, avoid = []) {
  for (let p = start; p < start + 50; p++) if (!avoid.includes(p) && (await isFree(p))) return p;
  throw new Error(`No free port near ${start}`);
}

const clientPort = await freePort(Number(process.env.CLIENT_PORT || 5180));
const serverPort = await freePort(Number(process.env.SERVER_PORT || 5181), [clientPort]);

console.log('\n  parley — dev');
console.log(`  ➜ App (open this):  http://localhost:${clientPort}`);
console.log(`  ➜ API + sockets:    http://localhost:${serverPort}\n`);

const env = { ...process.env, CLIENT_PORT: String(clientPort), SERVER_PORT: String(serverPort) };
const run = (name, args, cwd) => {
  const p = spawn('npm', args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], shell: false, detached: true });
  const tag = (d) => String(d).split('\n').filter(Boolean).forEach((l) => console.log(`[${name}] ${l}`));
  p.stdout.on('data', tag); p.stderr.on('data', tag);
  return p;
};
const kids = [run('server', ['run', 'dev'], path.join(root, 'server')), run('client', ['run', 'dev', '--', '--strictPort'], path.join(root, 'client'))];
const stop = () => kids.forEach((k) => { try { process.kill(-k.pid, 'SIGTERM'); } catch {} });
process.on('SIGINT', () => { stop(); process.exit(0); });
process.on('SIGTERM', () => { stop(); process.exit(0); });
kids.forEach((k) => k.on('exit', (code) => { if (code) { console.error('a process exited, shutting down'); stop(); process.exit(code); } }));
