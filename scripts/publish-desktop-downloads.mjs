#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const latestKey = "falcon/desktop/beta/latest.json";
const latestUrl = `https://saturnusgo.com/${latestKey}`;
function version(value) {
  const match = typeof value === "string" && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?(?:\+[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/.exec(value);
  if (!match || match[4]?.split(".").some(part => /^0\d+$/.test(part))) throw new Error("Invalid desktop version");
  return match;
}
const text = (a, b) => a === b ? 0 : a < b ? -1 : 1;
const numeric = (a, b) => a.length - b.length || text(a, b);
export function compareVersions(a, b) {
  const left = version(a), right = version(b);
  for (const index of [1, 2, 3]) { const order = numeric(left[index], right[index]); if (order) return order; }
  const l = left[4]?.split(".") ?? [], r = right[4]?.split(".") ?? [];
  if (!l.length || !r.length) return l.length ? -1 : r.length ? 1 : 0;
  for (let index = 0; index < Math.max(l.length, r.length); index++) {
    if (l[index] === undefined) return -1; if (r[index] === undefined) return 1;
    if (l[index] === r[index]) continue;
    const ln = /^\d+$/.test(l[index]), rn = /^\d+$/.test(r[index]);
    return ln && rn ? numeric(l[index], r[index]) : ln !== rn ? ln ? -1 : 1 : text(l[index], r[index]);
  }
  return 0;
}
function validateRelease(release) {
  version(release?.version);
  if (release.channel !== "beta" || release.baseUrl !== `https://saturnusgo.com/falcon/desktop/beta/${release.version}/` ||
    release.prefix !== `falcon/desktop/beta/${release.version}/` || typeof release.bucket !== "string" || !/^[a-z0-9-]+$/.test(release.bucket) ||
    release.checksums !== "SHA256SUMS.txt" || !Array.isArray(release.artifacts) || release.artifacts.length !== 3) throw new Error("Invalid desktop manifest");
  const formats = { "mac-arm64": ["mac", "beta.dmg", "application/x-apple-diskimage"], "mac-x64": ["mac", "beta.dmg", "application/x-apple-diskimage"],
    "win-x64": ["windows", "beta-setup.exe", "application/vnd.microsoft.portable-executable"] };
  const seen = new Set();
  for (const file of release.artifacts) {
    const format = file && Object.hasOwn(formats, file.id) && formats[file.id];
    if (!format || seen.has(file.id) || file.platform !== format[0] || file.file !== `Falcon-${release.version}-${file.id}-${format[1]}` ||
      file.contentType !== format[2] || !Number.isSafeInteger(file.bytes) || file.bytes <= 0 || typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256) ||
      ![file.label, file.minimum].every(text => typeof text === "string" && text.trim().length > 0 && text.length < 120)) throw new Error("Invalid desktop artifact");
    seen.add(file.id);
  }
}
async function putObject(bucket, key, path, file, cacheControl) {
  await new Promise((done, fail) => {
    const command = process.platform === "win32" ? "wrangler.cmd" : "wrangler";
    const args = ["r2", "object", "put", `${bucket}/${key}`, "--remote", "--file", path, "--content-type", file.contentType, "--cache-control", cacheControl];
    if (file.file) args.push("--content-disposition", `attachment; filename="${file.file}"`);
    const child = spawn(join(root, "node_modules/.bin", command), args, { cwd: root, stdio: "inherit", env: process.env });
    child.once("error", fail); child.once("close", code => code === 0 ? done() : fail(new Error(`Upload failed: ${key}`)));
  });
}
export async function publishDesktopDownloads({ release, directory, upload = false, request = fetch, put = putObject, log = console.log }) {
  validateRelease(release);
  const readLatest = async (missing = false) => {
    const response = await request(`${latestUrl}?verify=${Date.now()}`, { cache: "no-store", redirect: "error", credentials: "omit" });
    if (missing && response.status === 404) return null;
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Cannot read latest desktop release");
    const latest = await response.json(); validateRelease(latest);
    if (compareVersions(latest.version, release.version) > 0) throw new Error(`Refusing to replace newer release ${latest.version} with ${release.version}`);
    return latest;
  };
  if (upload) await readLatest(true);
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
    const previous = await request(url, { method: "HEAD", headers: { "accept-encoding": "identity" }, cache: "no-store", redirect: "error" });
    if (previous.status === 404) {
      await put(release.bucket, `${release.prefix}${file.file}`, path, file, "public, max-age=31536000, immutable");
    } else if (!previous.ok) throw new Error(`Could not check immutable object: ${file.file} (${previous.status})`);
    // An existing key is never overwritten: its bytes must already match below.
  }
  const headers = { "accept-encoding": "identity" };
  const head = await request(`${url}?verify=${Date.now()}`, { method: "HEAD", headers, cache: "no-store", redirect: "error" });
  if (!head.ok || Number(head.headers.get("content-length")) !== file.bytes) throw new Error(`HEAD mismatch: ${file.file} (${head.status})`);
  if (!head.headers.get("content-type")?.startsWith(file.contentType.split(";")[0])) throw new Error(`Unexpected content type: ${file.file}`);
  if (!head.headers.get("content-disposition")?.includes(`filename="${file.file}"`)) throw new Error(`Missing attachment header: ${file.file}`);
  const response = await request(`${url}?verify=${Date.now()}`, { headers, cache: "no-store", redirect: "error" });
  if (!response.ok || !response.body) throw new Error(`Download failed: ${file.file} (${response.status})`);
  const remote = await hash(response.body);
  if (remote.bytes !== file.bytes || remote.sha256 !== file.sha256) throw new Error(`Public artifact mismatch: ${file.file}`);
  log(JSON.stringify({ file: file.file, ...remote, url, status: head.status }));
}

  if (upload) {
    // Recheck immediately before the mutable pointer; serialize publishing jobs to avoid competing writers.
    await readLatest(true);
    const temporary = await mkdtemp(join(tmpdir(), "falcon-desktop-latest-"));
    try {
      const path = join(temporary, "latest.json"); await writeFile(path, `${JSON.stringify(release, null, 2)}\n`);
      await put(release.bucket, latestKey, path, { contentType: "application/json; charset=utf-8" }, "no-store");
    } finally { await rm(temporary, { recursive: true, force: true }); }
  }
  const latest = await readLatest();
  if (JSON.stringify(latest) !== JSON.stringify(release)) throw new Error("Latest desktop manifest does not match the verified release");
  log(JSON.stringify({ latest: latest.version, url: latestUrl }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), upload = args.includes("--upload"), verify = args.includes("--verify");
  const index = args.indexOf("--directory"), directory = index < 0 ? null : args[index + 1];
  if ((!upload && !verify) || (upload && !directory)) throw new Error("Usage: node scripts/publish-desktop-downloads.mjs --verify | --upload --directory /absolute/path/to/falcon-desktop/dist");
  if (upload && !process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error("Set CLOUDFLARE_ACCOUNT_ID before publishing.");
  const release = JSON.parse(await readFile(join(root, "app/src/modules/core-tms/desktop-downloads/model/release.json"), "utf8"));
  await publishDesktopDownloads({ release, directory, upload });
}
