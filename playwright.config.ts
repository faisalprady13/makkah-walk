import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101",
    env: {
      ROUTING_PROVIDER: "mock",
      OPENROUTESERVICE_API_KEY: "",
      NEXT_PUBLIC_MAP_STYLE_URL: "",
      NEXT_PUBLIC_BUILDING_TILE_URL: "",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
