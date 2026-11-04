import { defineConfig } from '@playwright/test';

/** Smoke-Test gegen die gebaute Site: erst node site/build.mjs, dann npm run smoke */
export default defineConfig({
  testDir: 'smoke',
  testMatch: '*.spec.mjs',
  timeout: 180_000,
  retries: 0,
  use: { baseURL: 'http://localhost:8772', browserName: 'chromium' },
  webServer: { command: 'node site/serve.mjs 8772', port: 8772, reuseExistingServer: false },
});
