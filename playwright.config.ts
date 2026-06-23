import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 0,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: process.env.CI
    ? {
        command: "npm run dev",
        url: "http://localhost:3001/dashboard",
        timeout: 60000,
        reuseExistingServer: true,
      }
    : undefined,
});
