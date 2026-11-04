import { defineConfig } from '@playwright/test';
import { PORT } from './smoke-mod/konstanten.mjs';

/** Moderation im echten Browser, gegen eine Wegwerf-Datenbank: erst node site/build.mjs, dann npm run smoke:mod */
export default defineConfig({
  testDir: 'smoke-mod',
  testMatch: '*.spec.mjs',
  timeout: 180_000,
  retries: 0,
  workers: 1,
  use: { baseURL: `http://localhost:${PORT}`, browserName: 'chromium' },
  webServer: { command: 'node smoke-mod/start.mjs', port: PORT, reuseExistingServer: false },
});
