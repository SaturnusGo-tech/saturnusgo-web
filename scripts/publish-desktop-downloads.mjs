#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

// This immutable manifest is also consumed by the authenticated profile download menu.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const release = JSON.parse(await readFile(join(root, "app/src/modules/core-tms/desktop-downloads/model/release.json"), "utf8"));
const args = process.argv.slice(2), upload = args.includes("--upload"), verify = args.includes("--verify");
const directoryIndex = args.indexOf("--directory");
const directory = directoryIndex < 0 ? null : args[directoryIndex + 1];
if ((!upload && !verify) || (upload && !directory)) {
  console.error("Usage: node scripts/publish-desktop-downloads.mjs --verify\n       node scripts/publish-desktop-downloads.mjs --upload --directory /absolute/path/to/falcon-desktop/dist");
  process.exit(1);
}
if (upload && !process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error("Set CLOUDFLARE_ACCOUNT_ID for the destination bucket before publishing.");
const hash = async body => {
  const digest = createHash("sha256"); let bytes = 0;
  for await (const chunk of body) { bytes += chunk.length; digest.update(chunk); }
  return { bytes, sha256: digest.digest("hex") };
};
const checksumBody = release.artifacts.map(file => `${file.sha256}  ${file.file}\n`).join("");
const files = [...release.artifacts, { file: release.checksums, bytes: Buffer.byteLength(checksumBody),
  sha256: createHash("sha256").update(checksumBody).digest("hex"), contentType: "text/plain; charset=utf-8" }];
for (const file of files) {
  const url = `${release.baseUrl}${file.file}`;
  if (upload) {
    const path = resolve(directory, file.file), local = await hash(createReadStream(path));
    if (local.bytes !== file.bytes || local.sha256 !== file.sha256) throw new Error(`Local artifact mismatch: ${file.file}`);
    const previous = await fetch(url, { method: "HEAD", headers: { "accept-encoding": "identity" }, cache: "no-store" });
    if (previous.status === 404) {
      await new Promise((done, fail) => {
        const command = process.platform === "win32" ? "wrangler.cmd" : "wrangler";
        const child = spawn(join(root, "node_modules/.bin", command), ["r2", "object", "put", `${release.bucket}/${release.prefix}${file.file}`,
          "--remote", "--file", path, "--content-type", file.contentType, "--content-disposition", `attachment; filename="${file.file}"`,
          "--cache-control", "public, max-age=31536000, immutable"], { cwd: root, stdio: "inherit", env: process.env });
        child.once("error", fail); child.once("close", code => code === 0 ? done() : fail(new Error(`Upload failed: ${file.file}`)));
      });
    } else if (!previous.ok) throw new Error(`Could not check immutable object: ${file.file} (${previous.status})`);
    // An existing key is never overwritten: its bytes must already match below.
  }
  const headers = { "accept-encoding": "identity" };
  const head = await fetch(`${url}?verify=${Date.now()}`, { method: "HEAD", headers, cache: "no-store" });
  if (!head.ok || Number(head.headers.get("content-length")) !== file.bytes) throw new Error(`HEAD mismatch: ${file.file} (${head.status})`);
  if (!head.headers.get("content-type")?.startsWith(file.contentType.split(";")[0])) throw new Error(`Unexpected content type: ${file.file}`);
  if (!head.headers.get("content-disposition")?.includes(`filename="${file.file}"`)) throw new Error(`Missing attachment header: ${file.file}`);
  const response = await fetch(`${url}?verify=${Date.now()}`, { headers, cache: "no-store" });
  if (!response.ok || !response.body) throw new Error(`Download failed: ${file.file} (${response.status})`);
  const remote = await hash(response.body);
  if (remote.bytes !== file.bytes || remote.sha256 !== file.sha256) throw new Error(`Public artifact mismatch: ${file.file}`);
  console.log(JSON.stringify({ file: file.file, ...remote, url, status: head.status }));
}
