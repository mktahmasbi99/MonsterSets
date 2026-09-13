import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "node_modules", "@bryllim", "workout-guide", "assets");
const destination = join(root, "public", "exercise-assets");

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

for (const entry of await readdir(source, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const targetDirectory = join(destination, entry.name);
  await mkdir(targetDirectory, { recursive: true });
  await cp(join(source, entry.name, "frame-1.png"), join(targetDirectory, "frame-1.png"));
}

