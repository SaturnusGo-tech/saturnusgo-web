import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = [
  "app/src/modules/core-tms/product-docs",
  "app/src/modules/core-tms/development-preview/docs",
];
const files = roots.flatMap(root => readdirSync(root, { recursive: true })
  .filter(path => /\.test\.tsx?$/.test(path))
  .map(path => join(root, path))).sort();
if (!files.length) throw new Error("Product documentation tests were not discovered");
const result = spawnSync(process.execPath,
  ["--import", "tsx", "--test", "--test-concurrency=2", ...files], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
