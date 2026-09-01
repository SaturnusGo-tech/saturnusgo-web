import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { filterCaseRows, flattenCaseGroups } from "../caseListModel";

function summary(id: string): TestCaseSummary {
  return {
    id, projectId: "project-1", key: `TMS-${id}`, folderPath: "/Automation",
    currentRevision: 1, title: `Case ${id}`, type: "manual", lifecycle: "ready",
    priority: "medium", component: "API", ownerIdentityId: null, tags: [],
    estimatedMinutes: 2, revisionCount: 1, archivedAt: null,
    createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z",
    etag: `"case-${id}:1"`,
  };
}

test("filters automated cases as a type without consuming arbitrary tags", () => {
  const automated = { ...summary("1"), type: "automated" as const, tags: ["smoke", "ci.backend"] };
  const taggedManual = { ...summary("2"), tags: ["automated", "owner-team-a"] };
  const rows = flattenCaseGroups([["/Automation", [automated, taggedManual]]]);
  assert.deepEqual(filterCaseRows(rows, { qlQuery: "type:automated" }).map((row) => row.testCase.id), ["1"]);
  assert.deepEqual(filterCaseRows(rows, { qlQuery: "type:автотест tag:ci.backend" }).map((row) => row.testCase.id), ["1"]);
  assert.deepEqual(filterCaseRows(rows, { qlQuery: "tag:owner-team-a" }).map((row) => row.testCase.id), ["2"]);
});

test("case type surfaces expose automated with a robot icon", () => {
  const badges = readFileSync(new URL("../../list/CaseBadges.tsx", import.meta.url), "utf8");
  const table = readFileSync(new URL("../../list/CasesTable.tsx", import.meta.url), "utf8");
  const metadata = readFileSync(new URL("../../detail/metadata/CaseMetadataControls.tsx", import.meta.url), "utf8");
  const metadataCss = readFileSync(new URL("../../detail/metadata/caseMetadata.module.css", import.meta.url), "utf8");
  const popovers = readFileSync(new URL("../../toolbar/CasesToolbarPopovers.tsx", import.meta.url), "utf8");
  assert.match(badges, /type === "automated"[\s\S]*<Bot/);
  assert.match(badges, /return <Hand/);
  assert.match(table, /<CaseTypeIcon locale=\{props\.locale\} type=\{item\.type\}/);
  assert.match(metadata, /value: "automated"[\s\S]*styles\.typeAutomated/);
  assert.match(metadata, /discardedProcedureCount[\s\S]*setPendingType/);
  assert.match(metadata, /<Modal[\s\S]*Change and remove/);
  assert.doesNotMatch(metadata, /window\.confirm|globalThis\.confirm/);
  assert.match(metadataCss, /\.typeAutomated/);
  assert.match(popovers, /\["manual", "checklist", "automated"\]/);
  assert.match(popovers, /caseTypes = \["all", "manual", "checklist", "automated"\]/);
  assert.match(popovers, /props\.filters\.type === value/);
});
