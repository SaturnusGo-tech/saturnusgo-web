import test from "node:test";
import assert from "node:assert/strict";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { createWorkspaceDataClient } from "../../../data/workspace/composition/workspace-data-client";
const dataset = { id: "dataset", name: "Customers", description: "", revision: 7, currentVersionId: "version7", status: "ACTIVE" as const, sources: [], views: [], createdAt: "now", updatedAt: "now" };
test("workspace data client scopes requests and uses authoritative container revision for linking and views", async () => {
  const calls: unknown[][] = [];
  const http = { async mutateResource(...args: unknown[]) { calls.push(args); return { data: { ...dataset, revision: 8 }, etag: null }; } } as unknown as TmsHttpClient;
  const port = createWorkspaceDataClient(http, "/workspaces/w/projects/p/test-data"); const signal = new AbortController().signal;
  const saved = await port.linkSource(dataset, "source/1", "link-key", signal);
  assert.equal(saved.revision, 8); assert.equal(calls[0][0], "/workspaces/w/projects/p/test-data/dataset-workspaces/dataset/sources");
  assert.deepEqual(calls[0][2], { sourceId: "source/1" }); assert.deepEqual(calls[0][3], { signal, idempotencyKey: "link-key", ifMatch: '"tdm-catalog:dataset:7"' });
  await port.saveView(dataset, { name: "Active", sourceIds: ["source/1"], query: "SELECT * FROM customers" }, null, "view-key", signal);
  assert.match(String(calls[1][0]), /\/views$/); assert.equal(calls[1][1], "POST");
});
test("source query keeps exact decimals and maps structured cells without sharing transport envelopes", async () => {
  const http = { async mutateResource() { return { data: { columns: [{ key: "amount", type: "Decimal" }, { key: "json", type: "JSON" }], rows: [{ amount: "9007199254740993.01", json: { valid: true } }], rowCount: 1, hasMore: false, limit: 50, offset: 0, truncated: false, durationMs: 2 } }; } } as unknown as TmsHttpClient;
  const result = await createWorkspaceDataClient(http, "/scope").query({ sourceIds: ["s"], sql: "SELECT * FROM source", limit: 50, offset: 0 }, new AbortController().signal);
  assert.equal(result.rows[0].amount, "9007199254740993.01"); assert.equal(result.rows[0].json, '{"valid":true}'); assert.equal(result.columns[0].name, "amount");
});
test("source metadata mapping drops unexpected connection secrets from ordinary GET responses", async () => {
  const http = { async getResource() { return { data: { id: "s", name: "Remote", description: "", kind: "POSTGRES", status: "ACTIVE", revision: 1, tableName: "", columns: [], rowCount: 0, provenance: "DATABASE", createdAt: "now", updatedAt: "now", connection: { host: "db.example.test", port: 5432, database: "qa", username: "reader", tls: true, password: "must-not-retain", apiKey: "must-not-retain" } } }; } } as unknown as TmsHttpClient;
  const result = await createWorkspaceDataClient(http, "/scope").source("s", new AbortController().signal);
  assert.deepEqual(result.connection, { host: "db.example.test", port: 5432, database: "qa", username: "reader", tls: true });
  assert.doesNotMatch(JSON.stringify(result), /must-not-retain/);
});
