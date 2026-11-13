import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPlan } from "../plan.mjs";
import { fixture, releaseObjects, metadata } from "../fixtures/store.mjs";

const now = "2026-11-13T10:00:00.000Z";
test("protects latest and one verified rollback, retires others before seven-day deletion", () => {
  const snapshot = fixture();
  let plan = buildPlan({ snapshot, now });
  assert.deepEqual(plan.protected, ["0.2.12", "0.2.11"]);
  assert.deepEqual(plan.retire.map(item => item.version), ["0.2.10"]);
  assert.deepEqual(plan.delete, []);
  snapshot.retired["0.2.10"] = { schema: 1, version: "0.2.10", retiredAt: "2026-11-06T10:00:00.000Z" };
  plan = buildPlan({ snapshot, now });
  assert.equal(plan.delete.length, 4);
  assert.equal(plan.deleteBytes, releaseObjects("0.2.10").reduce((n, o) => n + o.size, 0));
  assert.ok(plan.delete.every(item => item.key.startsWith("falcon/desktop/beta/0.2.10/")));
});
test("refuses destructive plans without verified rollback and quarantines changed or unknown releases", () => {
  const snapshot = fixture();
  snapshot.records["0.2.11"].verification = "inventory-only";
  snapshot.records["0.2.10"].verification = "inventory-only";
  assert.equal(buildPlan({ snapshot, now }).retire.length, 0);
  snapshot.records["0.2.11"].verification = "sha256";
  snapshot.objects.push({ ...snapshot.objects[0], key: "falcon/desktop/beta/0.2.10/unknown.zip" });
  assert.equal(buildPlan({ snapshot, now }).retire.length, 0);
  assert.ok(buildPlan({ snapshot, now }).skipped.some(item => item.version === "0.2.10"));
  snapshot.objects = snapshot.objects.filter(o => !o.key.endsWith("unknown.zip"));
  snapshot.objects.find(o => o.key.includes("0.2.10/")).etag = "changed";
  assert.equal(buildPlan({ snapshot, now }).retire.length, 0);
});
test("failed managed uploads wait 48 hours after their newest write and never delete unknown files", () => {
  const snapshot = fixture(), version = "0.2.13";
  const objects = releaseObjects(version).slice(0, 2);
  snapshot.objects.push(...objects);
  snapshot.uploads[version] = { schema: 1, release: metadata(version).release, startedAt: "2026-11-11T10:00:00.000Z" };
  let plan = buildPlan({ snapshot, now });
  assert.equal(plan.delete.length, 2);
  objects[0].last_modified = "2026-11-12T10:00:00.000Z";
  assert.equal(buildPlan({ snapshot, now }).delete.length, 0);
});
test("legacy adoption is metadata only; first retirement starts on apply and preserves provenance", () => {
  const snapshot = fixture(); delete snapshot.records["0.2.10"];
  const plan = buildPlan({ snapshot, now, adoptions: [metadata("0.2.10", "inventory-only")] });
  assert.equal(plan.adopt.length, 1); assert.equal(plan.retire.length, 1); assert.equal(plan.delete.length, 0);
  assert.ok(!plan.delete.some(item => item.key.includes("_retention") || item.key.endsWith("latest.json")));
});
