import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const worker = require.resolve(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
);

const destination = path.join(
  process.cwd(),
  "public",
  "pdfjs",
);

await mkdir(destination, { recursive: true });

await copyFile(
  worker,
  path.join(destination, "pdf.worker.legacy.min.mjs"),
);

