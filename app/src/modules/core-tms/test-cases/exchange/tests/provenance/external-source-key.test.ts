import test from "node:test";
import assert from "node:assert/strict";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { externalImportClient } from "../../data/normalization/external-import-client";
import { importProjectCases } from "../../application/import-project-cases";

const project = { id: "p", key: "P", name: "Project" };
const signal = new AbortController().signal;

test("normalized source keys follow source paths into persisted provenance even if responses reorder cases", async () => {
  const writes: { tags: string[]; changeNote: string }[] = [];
  const http = { mutate: async () => ({ cases: [
    { sourcePath: "/1", folderPath: "/Sheet", content: { title: "Numeric source" }, warnings: [] },
    { sourcePath: "/0", folderPath: "/Sheet", content: { title: "CSV source" }, warnings: [] },
  ], issues: [] }), mutateResource: async (_path: string, _method: string, body: { tags: string[]; changeNote: string }) => {
    writes.push(body); return { data: {}, etag: null };
  } } as unknown as TmsHttpClient;
  const normalized = await externalImportClient(http, project, "en").normalize([
    { path: "/0", value: { sourceKey: "WEB-1" }, context: [] },
    { path: "/1", value: { sourceKey: 42 }, context: [] },
  ], [], signal);
  assert.deepEqual(normalized.cases.map(item => item.value.sourceKey), ["42", "WEB-1"]);
  const result = await importProjectCases(http, project.id, { schemaVersion: "saturnusgo.tms.test-cases.v2",
    exportedAt: "2026-11-12T00:00:00Z", project, testCases: normalized.cases.map(item => item.value) });
  assert.equal(result.completed, 2);
  assert.deepEqual(writes.map(body => ({ tags: body.tags, note: body.changeNote })), [
    { tags: ["source-42"], note: "Imported from 42" },
    { tags: ["source-web-1"], note: "Imported from WEB-1" },
  ]);
});

test("an invalid explicit canonical source key fails before normalized cases can be persisted", async () => {
  const http = { mutate: async () => ({ cases: [
    { sourcePath: "/0", folderPath: "/Sheet", content: { title: "Case" }, warnings: [] },
  ], issues: [] }) } as unknown as TmsHttpClient;
  for (const sourceKey of [null, {}, "", "x".repeat(129), Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(externalImportClient(http, project, "en").normalize([
      { path: "/0", value: { sourceKey }, context: [] },
    ], [], signal), /sourceKey/);
  }
  const result = await externalImportClient(http, project, "en").normalize([
    { path: "/0", value: { title: "No source identity" }, context: [] },
  ], [], signal);
  assert.equal(result.cases[0]?.value.sourceKey, undefined);
});
