import { defineConfig } from "@playwright/test";

const BASE_URL =
  process.env.BASE_URL || "https://frontend-one-chi-43.vercel.app";
const API_URL =
  process.env.API_URL || "https://backend-sigma-six-19.vercel.app/api";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false, // sequential — each test depends on prior state
  retries: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: { "Content-Type": "application/json" },
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
