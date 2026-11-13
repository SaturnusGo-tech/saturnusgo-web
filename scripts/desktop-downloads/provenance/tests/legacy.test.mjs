import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { adoptLegacy } from "../legacy.mjs";
import { fixture, metadata, releaseObjects } from "../../retention/fixtures/store.mjs";
const hash = value => createHash("sha256").update(value).digest("hex");
function legacyFixture() {
  const snapshot = fixture(), content = new Map(), requests = [];
  snapshot.records = {};
  for (const version of ["0.2.10", "0.2.11", "0.2.12"]) {
    const record = metadata(version), objects = releaseObjects(version);
    for (const file of record.release.artifacts) {
      const body = `controlled ${file.id}`; file.bytes = Buffer.byteLength(body); file.sha256 = hash(body);
      objects.find(o => o.key.endsWith(file.file)).size = file.bytes;
      content.set(record.release.prefix + file.file, body);
    }
    content.set(record.release.prefix + record.release.checksums, record.release.artifacts.map(f => `${f.sha256}  ${f.file}\n`).join(""));
    snapshot.objects = snapshot.objects.filter(o => !o.key.includes(`/${version}/`)).concat(objects);
    if (version === "0.2.12") snapshot.latest = record.release;
  }
  return { snapshot, content, requests, store: { async read(key) { requests.push(key); return new Response(content.get(key)); } } };
}
test("adoption hashes only rollback bodies, labels inventory-only retired sets, and trusts exact latest manifest", async () => {
  const f = legacyFixture(), records = await adoptLegacy({ ...f, log() {} });
  assert.deepEqual(records.map(r => [r.release.version, r.verification]), [["0.2.12", "latest-manifest"], ["0.2.11", "sha256"], ["0.2.10", "inventory-only"]]);
  assert.equal(f.requests.filter(key => !key.endsWith("SHA256SUMS.txt")).length, 3);
  assert.ok(f.requests.filter(key => !key.endsWith("SHA256SUMS.txt")).every(key => key.includes("/0.2.11/")));
});
test("unknown objects are quarantined and invalid checksum lists are never adopted", async () => {
  const f = legacyFixture();
  f.snapshot.objects.push({ ...f.snapshot.objects[0], key: "falcon/desktop/beta/0.2.10/delta.zip" });
  f.content.set("falcon/desktop/beta/0.2.11/SHA256SUMS.txt", `${"a".repeat(64)}  ../unknown.dmg\n`);
  assert.deepEqual((await adoptLegacy({ ...f, log() {} })).map(r => r.release.version), ["0.2.12"]);
});
test("rollback corruption and latest checksum disagreement fail adoption", async () => {
  const f = legacyFixture(); f.content.set("falcon/desktop/beta/0.2.11/Falcon-0.2.11-mac-arm64-beta.dmg", "corrupted");
  await assert.rejects(adoptLegacy({ ...f, log() {} }), /SHA-256 mismatch/);
  const g = legacyFixture(); g.snapshot.latest.artifacts[0].sha256 = "f".repeat(64);
  await assert.rejects(adoptLegacy({ ...g, log() {} }), /disagree/);
});
