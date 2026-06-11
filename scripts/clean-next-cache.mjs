import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const nextOutput = join(projectRoot, ".next");

rmSync(nextOutput, { recursive: true, force: true });
console.log(`Cleared Next.js output: ${nextOutput}`);
