import { defineConfig } from '@playwright/test';
import { PORT } from './smoke-mod/konstanten.mjs';

/**
 * Moderation im echten Browser, gegen eine Wegwerf-Datenbank: erst node site/build.mjs, dann npm run smoke:mod. Über HTTPS mit einem
 * Wegwerf-Zertifikat (smoke-mod/start.mjs), sonst meldet WebKit nicht an; `ignoreHTTPSErrors`, weil niemand dem Zertifikat traut.
 */
export default defineConfig({
  testDir: 'smoke-mod',
  testMatch: '*.spec.mjs',
  timeout: 180_000,
  retries: 0,
  workers: 1,
  use: { baseURL: `https://localhost:${PORT}`, ignoreHTTPSErrors: true, browserName: process.env.SMOKE_BROWSER ?? 'chromium' },
  webServer: { command: 'node smoke-mod/start.mjs', url: `https://localhost:${PORT}/eidl/`, ignoreHTTPSErrors: true, reuseExistingServer: false },
});
