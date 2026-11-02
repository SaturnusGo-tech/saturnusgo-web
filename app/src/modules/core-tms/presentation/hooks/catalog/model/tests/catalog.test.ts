import assert from "node:assert/strict";
import test from "node:test";
import { catalogEntries, filterCatalog } from "../catalog-model";

const base = { showCodex: true, showOthers: true, codexStatus: "available" as const, swaggerStatus: "available" as const,
  codexCompanyStatus: "active" as const, configuration: null, status: null, statusFailed: false,
  connectorState: "ready" as const, connections: [], projectId: "p" };

test("connected catalog includes an active company Codex without hiding loading or failure", () => {
  const connected = filterCatalog(catalogEntries(base), "all", "connected", "");
  assert.deepEqual(connected.map(entry => entry.integration.id), ["codex"]);
  assert.equal(catalogEntries({ ...base, codexStatus: "attention" }).find(entry => entry.integration.id === "codex")?.status, "attention");
  assert.equal(catalogEntries({ ...base, codexStatus: "checking" }).find(entry => entry.integration.id === "codex")?.status, "checking");
});

test("catalog permission filtering happens before query, group and status selection", () => {
  const restricted = catalogEntries({ ...base, showOthers: false });
  assert.deepEqual(restricted.map(entry => entry.integration.id), ["codex"]);
  assert.deepEqual(filterCatalog(restricted, "all", "all", "Swagger"), []);
  assert.deepEqual(catalogEntries({ ...base, showOthers: false, showCodex: false }), []);
  assert.deepEqual(filterCatalog(catalogEntries(base), "api", "all", " openapi ").map(entry => entry.integration.id), ["swagger"]);
});
