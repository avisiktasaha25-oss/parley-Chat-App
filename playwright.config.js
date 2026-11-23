import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CLIENT = 5190, SERVER = 5191;
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parley-e2e-'));

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: `http://localhost:${CLIENT}`, launchOptions: { executablePath: process.env.CHROME_PATH || undefined } },
  webServer: [
    {
      command: 'npm run start -w server',
      url: `http://localhost:${SERVER}/api/health`,
      env: { SERVER_PORT: String(SERVER), DB_PATH: path.join(dbDir, 'e2e.db') },
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -w client -- --strictPort',
      url: `http://localhost:${CLIENT}`,
      env: { CLIENT_PORT: String(CLIENT), SERVER_PORT: String(SERVER) },
      reuseExistingServer: false,
    },
  ],
});
