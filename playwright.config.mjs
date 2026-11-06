import { defineConfig } from '@playwright/test';

const url = process.env.SMOKE_URL;

/** Smoke-Test gegen die gebaute Site: erst node site/build.mjs, dann npm run smoke. Mit SMOKE_URL gegen einen echten Host. */
export default defineConfig({
  testDir: 'smoke',
  testMatch: '*.spec.mjs',
  timeout: 180_000,
  retries: 0,
  use: { baseURL: url ?? 'http://localhost:8772', browserName: process.env.SMOKE_BROWSER ?? 'chromium' },
  webServer: url ? undefined : { command: 'node site/serve.mjs 8772', port: 8772, reuseExistingServer: false },
});
