// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 15000,

  use: {
    baseURL: `file://${__dirname}/index.html`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 5000,
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile iPhone SE',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'Mobile iPhone 12',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
