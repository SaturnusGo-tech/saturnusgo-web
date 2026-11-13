#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir, hostname } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
import { compareVersions, latestKey, validateRelease } from "./desktop-downloads/release/manifest.mjs";
export { compareVersions, latestKey };
import { withReleaseLock } from "./desktop-downloads/release/lock.mjs";
import { createCloudflareStore } from "./desktop-downloads/storage/cloudflare.mjs";
import { createPublishingLifecycle } from "./desktop-downloads/provenance/publish.mjs";
const latestUrl = `https://saturnusgo.com/${latestKey}`;
async function putObject(bucket, key, path, file, cacheControl) {
  await new Promise((done, fail) => {
    const command = process.platform === "win32" ? "wrangler.cmd" : "wrangler";
    const args = ["r2", "object", "put", `${bucket}/${key}`, "--remote", "--file", path, "--content-type", file.contentType, "--cache-control", cacheControl];
    if (file.file) args.push("--content-disposition", `attachment; filename="${file.file}"`);
    const child = spawn(join(root, "node_modules/.bin", command), args, { cwd: root, stdio: "inherit", env: process.env });
    child.once("error", fail); child.once("close", code => code === 0 ? done() : fail(new Error(`Upload failed: ${key}`)));
  });
}
export async function publishDesktopDownloads(options) {
  return options.upload ? withReleaseLock(() => publish(options)) : publish(options);
}
async function publish({ release, directory, upload = false, request = fetch, put = putObject, log = console.log, lifecycle }) {
  validateRelease(release);
  const readLatest = async (missing = false) => {
    const response = await request(`${latestUrl}?verify=${Date.now()}`, { cache: "no-store", redirect: "error", credentials: "omit" });
    if (missing && response.status === 404) return null;
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Cannot read latest desktop release");
    const latest = await response.json(); validateRelease(latest);
    if (compareVersions(latest.version, release.version) > 0) throw new Error(`Refusing to replace newer release ${latest.version} with ${release.version}`);
    return latest;
  };
  if (upload) {
    await readLatest(true);
    await lifecycle?.beforePublish(release);
  }
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
  if (upload && lifecycle) {
    try { await lifecycle.afterPublish(release); }
    catch (error) { log(JSON.stringify({ installerRetention: "failed", release: release.version, reason: error.message, published: true })); }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), upload = args.includes("--upload"), verify = args.includes("--verify");
  const index = args.indexOf("--directory"), directory = index < 0 ? null : args[index + 1];
  if ((!upload && !verify) || (upload && !directory)) throw new Error("Usage: node scripts/publish-desktop-downloads.mjs --verify | --upload --directory /absolute/path/to/falcon-desktop/dist --managed-host <hostname>");
  if (upload && !process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error("Set CLOUDFLARE_ACCOUNT_ID before publishing.");
  const release = JSON.parse(await readFile(join(root, "app/src/modules/core-tms/desktop-downloads/model/release.json"), "utf8"));
  const hostIndex = args.indexOf("--managed-host");
  if (upload && args[hostIndex + 1] !== hostname()) throw new Error("Publishing requires --managed-host matching this exclusive publishing host");
  const lifecycle = upload ? createPublishingLifecycle({ store: await createCloudflareStore() }) : undefined;
  await publishDesktopDownloads({ release, directory, upload, lifecycle });
}
