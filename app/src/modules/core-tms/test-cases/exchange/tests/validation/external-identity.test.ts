import test from "node:test";
import assert from "node:assert/strict";
import { normalizeExternalImport } from "../../application/normalization/normalize-external-import";
import { parseTestCaseExchange } from "../../validation/parse-test-case-exchange";
import type { ExternalImportCheckpoint, ExternalImportPort } from "../../model/external/external-import";

test("duplicate source identities across normalization batches reject before persistence, including checkpoint resume", async () => {
  const records = Array.from({ length: 16 }, (_, index) => ({ path: `/${index}`, value: {}, context: [] }));
  const checkpoint: ExternalImportCheckpoint = { records: null, processed: 0, cases: [], issues: [] };
  const port: ExternalImportPort = { inspect: async () => records, normalize: async batch => ({ cases: batch.map(record => ({
    sourcePath: record.path, warnings: [], value: parseTestCaseExchange(JSON.stringify({
      schemaVersion: "saturnusgo.tms.test-cases.v2", exportedAt: "2026-11-12", project: { key: "Q", name: "QA" },
      testCases: [{ title: record.path, sourceKey: record.path === "/15" ? "ID-0" : `ID-${record.path.slice(1)}` }],
    })).testCases[0],
  })), issues: [] }) };
  for (let attempt = 0; attempt < 2; attempt++) {
    await assert.rejects(normalizeExternalImport(port, {}, checkpoint, [], new AbortController().signal, () => {}),
      (error: unknown) => error instanceof Error && "code" in error && error.code === "IMPORT_MAPPING_INVALID");
  }
});
