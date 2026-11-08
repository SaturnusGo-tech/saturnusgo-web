import assert from "node:assert/strict";
import test from "node:test";
import { TmsApiError } from "../../../../../../../core/tms/transport/http";
import { savePastedRequirements } from "../save-pasted-requirements";

const scope = {workspaceId: "w", projectId: "p"};

test("reconciliation protects existing selections across pages and prefers a pasted section", async () => {
  const writes: [string, string | null][] = [];
  const paginated = {docId: "manual", title: "Rule", sectionId: "existing", sectionTitle: "Existing", version: 1};
  await savePastedRequirements({
    get: async () => { throw new Error("Unexpected publication lookup"); },
    listCaseRequirements: async (_scope, _caseId, options) => options?.cursor === "first"
      ? {requirements: [paginated], nextCursor: null, canEdit: true}
      : {requirements: [], nextCursor: "first", canEdit: true},
    linkRequirement: async (_scope, _caseId, docId, sectionId) => {
      writes.push([docId, sectionId]);
      return {docId};
    },
  }, scope, "case", [{docId: "manual", sectionId: "other"}, {docId: "new"}, {docId: "new", sectionId: "rule"}]);
  assert.deepEqual(writes, [["new", "rule"]]);
});

test("stale links are left in the case text while transient association failures can be retried", async () => {
  const writes: string[] = [];
  const outage = new TmsApiError("Service unavailable", 503, null);
  await assert.rejects(savePastedRequirements({
    get: async () => { throw new TmsApiError("Publication unavailable", 404, null); },
    listCaseRequirements: async () => ({requirements: [], nextCursor: null, canEdit: true}),
    linkRequirement: async (_scope, _caseId, docId) => {
      writes.push(docId);
      throw outage;
    },
  }, scope, "case", [{docId: "stale", version: 3, sectionId: "removed"}, {docId: "transient"}]), outage);
  assert.deepEqual(writes, ["transient"]);
});
