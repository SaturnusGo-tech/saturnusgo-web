import { copyFile, lstat, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MAXIMUM_ASSET_BYTES = 25 * 1024 * 1024;
const ROUTES = ["admin", "profile", "sandbox", "privacy", "testcases/umbrella-home/work"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function collect(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed: ${relative}`);
    if (entry.isDirectory()) files.push(...await collect(path, relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Unsupported artifact: ${relative}`);
  }
  return files.sort();
}

export async function stageAssets(sourceDirectory, releaseDirectory, sourceSha) {
  if (!/^[0-9a-f]{40}$/.test(sourceSha ?? "")) throw new Error("FALCON_CODEX_EXPORT_SHA must be a full reviewed commit SHA");
  const mapping = new Map();
  for (const route of ROUTES) {
    for (const extension of ["html", "txt"]) {
      const path = `${route}/index.${extension}`;
      const info = await lstat(join(sourceDirectory, path));
      if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Required route is not a regular file: ${path}`);
      mapping.set(path, route.startsWith("testcases/") ? path : `tms-origin/${path}`);
    }
  }
  for (const prefix of ["_next", "falcon"]) {
    for (const path of await collect(join(sourceDirectory, prefix), prefix)) {
      if (!path.startsWith("falcon/landing/")) mapping.set(path, path);
    }
  }
  mapping.set("favicon.ico", "favicon.ico");
  const entries = [];
  for (const [source, target] of mapping) {
    const info = await lstat(join(sourceDirectory, source));
    if (!info.isFile() || info.isSymbolicLink() || info.size > MAXIMUM_ASSET_BYTES) {
      throw new Error(`Asset must be a regular file of at most 25 MiB: ${source}`);
    }
    const bytes = await readFile(join(sourceDirectory, source));
    entries.push({ path: target, bytes: bytes.length, sha256: sha256(bytes), source });
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  const directory = join(releaseDirectory, "assets");
  await rm(directory, { recursive: true, force: true });
  for (const entry of entries) {
    const target = join(directory, entry.path);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(sourceDirectory, entry.source), target);
  }
  const manifest = {
    schemaVersion: 1, frontendSourceSha: sourceSha,
    assetSha256: sha256(JSON.stringify(entries.map(({ source, ...entry }) => entry))),
    fileCount: entries.length, totalBytes: entries.reduce((total, entry) => total + entry.bytes, 0),
    maximumAssetBytes: Math.max(...entries.map((entry) => entry.bytes)),
    entries: entries.map(({ source, ...entry }) => entry),
  };
  await writeFile(join(releaseDirectory, "asset-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repository = fileURLToPath(new URL("../../../../", import.meta.url));
  const { entries, ...evidence } = await stageAssets(join(repository, "out"), join(repository, "dist/codex-lab"),
    process.env.FALCON_CODEX_EXPORT_SHA);
  console.log(JSON.stringify(evidence, null, 2));
}
