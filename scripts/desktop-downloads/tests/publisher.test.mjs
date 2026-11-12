import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { compareVersions, latestKey, publishDesktopDownloads } from "../../publish-desktop-downloads.mjs";

const sha = data => createHash("sha256").update(data).digest("hex");
function release(version = "0.2.12") {
  const formats = [["mac-arm64", "mac", "beta.dmg", "application/x-apple-diskimage"], ["mac-x64", "mac", "beta.dmg", "application/x-apple-diskimage"],
    ["win-x64", "windows", "beta-setup.exe", "application/vnd.microsoft.portable-executable"]];
  return { version, channel: "beta", bucket: "cdn-saturnusgo", prefix: `falcon/desktop/beta/${version}/`,
    baseUrl: `https://saturnusgo.com/falcon/desktop/beta/${version}/`, checksums: "SHA256SUMS.txt", artifacts: formats.map(([id, platform, ext, contentType]) => {
      const data = Buffer.from(`controlled installer ${id}`);
      return { id, platform, label: id, minimum: "Test OS", file: `Falcon-${version}-${id}-${ext}`, bytes: data.length, sha256: sha(data), contentType };
    }) };
}
async function fixture(t, current = null) {
  const directory = await mkdtemp(join(tmpdir(), "falcon-publisher-test-")); t.after(() => rm(directory, { recursive: true, force: true }));
  const manifest = release(), store = new Map(), calls = [], requests = [];
  for (const file of manifest.artifacts) await writeFile(join(directory, file.file), `controlled installer ${file.id}`);
  await writeFile(join(directory, manifest.checksums), manifest.artifacts.map(file => `${file.sha256}  ${file.file}\n`).join(""));
  if (current) store.set(latestKey, { data: Buffer.from(JSON.stringify(current)), contentType: "application/json" });
  const request = async (url, options) => {
    requests.push({ url, options });
    const key = new URL(url).pathname.slice(1), object = store.get(key);
    if (!object) return new Response("Missing", { status: 404 });
    const headers = { "content-type": object.contentType, "content-length": String(object.data.length) };
    if (object.file) headers["content-disposition"] = `attachment; filename="${object.file}"`;
    return new Response(options.method === "HEAD" ? null : object.data, { headers });
  };
  const put = async (bucket, key, path, metadata, cache) => {
    assert.equal(bucket, manifest.bucket); const data = await readFile(path);
    calls.push({ key, cache }); store.set(key, { data, ...metadata });
  };
  const run = (options = {}) => publishDesktopDownloads({ release: manifest, directory, upload: true, request, put, log() {}, ...options });
  return { manifest, directory, store, calls, requests, request, run };
}

test("publish verifies every immutable artifact before advancing latest.json without immutable caching", async t => {
  const f = await fixture(t); await f.run();
  assert.deepEqual(f.calls.map(call => call.key), [...f.manifest.artifacts.map(file => f.manifest.prefix + file.file), f.manifest.prefix + f.manifest.checksums, latestKey]);
  assert.ok(f.calls.slice(0, -1).every(call => call.cache === "public, max-age=31536000, immutable"));
  assert.equal(f.calls.at(-1).cache, "no-store");
  assert.deepEqual(JSON.parse(f.store.get(latestKey).data), f.manifest);
  assert.ok(f.requests.every(({ options }) => options.cache === "no-store"));
  const writes = f.calls.length; await f.run();
  assert.equal(f.calls.length, writes + 1, "an idempotent repeat never overwrites an existing immutable artifact");
});

test("bad public bytes cannot advance the mutable latest pointer or overwrite the immutable object", async t => {
  const f = await fixture(t), file = f.manifest.artifacts[0];
  f.store.set(f.manifest.prefix + file.file, { ...file, data: Buffer.alloc(file.bytes) });
  await assert.rejects(f.run(), /Public artifact mismatch/);
  assert.deepEqual(f.calls, []); assert.equal(f.store.has(latestKey), false);
});

test("an older publication and a newer release appearing during verification cannot roll latest back", async t => {
  const f = await fixture(t, release("0.2.13")); await assert.rejects(f.run(), /Refusing to replace newer release/);
  assert.equal(f.calls.length, 0); assert.equal(f.requests.length, 1);
  const g = await fixture(t); let latestReads = 0;
  await assert.rejects(g.run({ request: async (url, options) => {
    if (new URL(url).pathname.endsWith("latest.json") && ++latestReads === 2) g.store.set(latestKey, { data: Buffer.from(JSON.stringify(release("0.2.13"))), contentType: "application/json" });
    return g.request(url, options);
  } }), /Refusing to replace newer release/);
  assert.equal(g.calls.some(call => call.key === latestKey), false);
});

test("verify mode never writes and fails for unavailable or malformed latest metadata", async t => {
  const f = await fixture(t); await f.run(); f.calls.length = 0; await f.run({ upload: false }); assert.deepEqual(f.calls, []);
  await assert.rejects(f.run({ request: async () => new Response("Unavailable", { status: 503 }) }), /Cannot read latest/);
  await assert.rejects(f.run({ request: async () => Response.json({ version: "0.2.12" }) }), /Invalid desktop manifest/);
  assert.deepEqual(f.calls, []);
});

test("release ordering follows SemVer and rejects malformed or unsafe manifest paths", async t => {
  assert.ok(compareVersions("0.2.12", "0.2.9") > 0); assert.ok(compareVersions("0.2.12-beta.10", "0.2.12-beta.2") > 0);
  assert.ok(compareVersions("0.2.12", "0.2.12-rc.1") > 0); assert.equal(compareVersions("0.2.12+x", "0.2.12+y"), 0);
  assert.throws(() => compareVersions("0.2.12-beta.01", "0.2.9"));
  const f = await fixture(t); await assert.rejects(f.run({ release: { ...f.manifest, baseUrl: "https://attacker.test/" } }), /Invalid desktop manifest/);
  await assert.rejects(f.run({ release: { ...f.manifest, artifacts: [{ ...f.manifest.artifacts[0], file: "../installer.dmg" }, ...f.manifest.artifacts.slice(1)] } }), /Invalid desktop artifact/);
  assert.deepEqual(f.calls, []);
});
