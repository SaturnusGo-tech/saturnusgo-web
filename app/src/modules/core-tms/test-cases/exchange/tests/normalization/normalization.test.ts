import test from "node:test";
import assert from "node:assert/strict";
import { normalizeExternalImport } from "../../application/normalization/normalize-external-import";
import type { ExternalImportCheckpoint, ExternalImportPort } from "../../model/external/external-import";
const fresh = (): ExternalImportCheckpoint => ({ records: null, processed: 0, cases: [], issues: [] });
const records = Array.from({ length: 31 }, (_, i) => ({ path: `/${i}`, value: { name: `Case ${i}` }, context: [] }));
test("resumes the unfinished batch without rediscovering or repeating completed records", async () => {
  const checkpoint = fresh(); let discoveries = 0; let fail = true; const batches: string[][] = [];
  const port: ExternalImportPort = {
    inspect: async () => { discoveries++; return records; },
    normalize: async batch => { batches.push(batch.map(r => r.path)); if (batch[0].path === "/15" && fail) throw new Error("Temporary failure");
      return { cases: [], issues: batch.map(r => ({ sourcePath: r.path, code: "IMPORT_MAPPING_INVALID" })) }; },
  };
  await assert.rejects(normalizeExternalImport(port, {}, checkpoint, [], new AbortController().signal, () => {}));
  assert.equal(checkpoint.processed, 15); fail = false;
  await normalizeExternalImport(port, {}, checkpoint, [], new AbortController().signal, () => {});
  assert.equal(discoveries, 1); assert.equal(checkpoint.processed, 31); assert.equal(checkpoint.issues.length, 31);
  assert.deepEqual(batches.map(b => b[0]), ["/0", "/15", "/15", "/30"]);
});
test("cancellation rejects a late discovery result without updating the checkpoint", async () => {
  const checkpoint = fresh(); const controller = new AbortController(); let progress = 0;
  const port: ExternalImportPort = { inspect: async () => { controller.abort(); return records; }, normalize: async () => { throw new Error("Must not normalize"); } };
  await assert.rejects(normalizeExternalImport(port, {}, checkpoint, [], controller.signal, () => progress++));
  assert.equal(checkpoint.records, null); assert.equal(progress, 0);
});
test("a missing source record fails closed before progress is committed", async () => {
  const checkpoint = fresh(); const port: ExternalImportPort = { inspect: async () => records, normalize: async () => ({ cases: [], issues: [] }) };
  await assert.rejects(normalizeExternalImport(port, {}, checkpoint, [], new AbortController().signal, () => {}), /IMPORT_MAPPING_INVALID/);
  assert.equal(checkpoint.processed, 0);
});
