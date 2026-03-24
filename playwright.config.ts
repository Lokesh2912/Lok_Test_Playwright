import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 30_000
  },
  retries: 1,
  use: {
    actionTimeout: 30_000,
    baseURL: 'https://demo.prestashop.com/#/en/front',
    navigationTimeout: 30_000,
    trace: 'on-first-retry'
  }
});
