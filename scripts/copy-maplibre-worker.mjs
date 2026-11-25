import { copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageJsonPath = require.resolve("maplibre-gl/package.json");
const packageDirectory = dirname(packageJsonPath);
const projectDirectory = fileURLToPath(new URL("..", import.meta.url));

await copyFile(
  join(packageDirectory, "dist", "maplibre-gl-worker.mjs"),
  join(projectDirectory, "public", "maplibre-gl-worker.mjs"),
);
