import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { componentHarness } from "../../../../../../../portfolios/tests/support/component-harness";
import { createEmptyRevision } from "../../../../../../../helpers/cases/caseRevision";
import { emptySharedStepDraft, type SharedStep } from "../../../../../../../shared-steps/model/shared-step";
import { insertSharedStepAfter } from "../../insert-shared-step";
import type { useSharedStepInsertion } from "../../useSharedStepInsertion";
import { filterPendingCaseAttachments } from "../../../../../../../application/evidence/case/pendingCaseAttachment";

const shared = (): SharedStep => ({ id: "shared", projectId: "p", folderId: null, folderPath: "/", currentRevision: 1,
  current: { ...emptySharedStepDraft(), title: "Sign in", revision: 1, createdBy: "qa", createdAt: "now" },
  revisionCount: 1, archivedAt: null, createdAt: "now", updatedAt: "now", etag: "v1" });
function setup(t: TestContext) {
  const h = componentHarness(); t.after(() => h.dispose());
  const pending: ((value: SharedStep | null) => void)[] = [];
  const loaded = h.load<{ useSharedStepInsertion: typeof useSharedStepInsertion }>(new URL("../../useSharedStepInsertion.ts", import.meta.url),
    name => name.endsWith("insert-shared-step") ? { insertSharedStepAfter } : undefined);
  let revision = createEmptyRevision();
  let editing = true;
  let pendingStepIds = new Set<string>();
  const render = () => {
    const captured = revision;
    return h.render(() => loaded.useSharedStepInsertion(revision,
      () => new Promise(resolve => pending.push(resolve)), next => { revision = { ...captured, ...next }; }, editing, pendingStepIds));
  };
  return { h, pending, render, stopEditing: () => { editing = false; }, get revision() { return revision; },
    attach: (stepId: string) => { pendingStepIds = new Set([stepId]); }, edit: (next: typeof revision) => { revision = next; } };
}
test("files attached while loading keep the blank first row and remain queued after insertion", async t => {
  const h = setup(t), firstId = h.revision.steps[0].id;
  const task = h.render().insert(-1, "shared");
  const entries = [{ id: "pending", fieldKey: `step:${firstId}:action`, stepId: firstId,
    file: new File(["evidence"], "evidence.txt", { type: "text/plain" }) }];
  h.attach(firstId); h.render(); h.pending[0](shared()); await task;
  assert.equal(h.revision.steps.length, 2);
  assert.equal(h.revision.steps[0].sharedStepId, "shared");
  assert.equal(h.revision.steps[1].id, firstId);
  assert.deepEqual(filterPendingCaseAttachments(entries, new Set(h.revision.steps.map(step => step.id))), entries);
});
test("a pending insertion uses current text rather than overwriting edits made during loading", async t => {
  const h = setup(t), task = h.render().insert(-1, "shared");
  assert.equal(h.render().pending, true);
  h.edit({ ...h.revision, description: "Latest description", steps: [{ ...h.revision.steps[0], action: "Edited while loading" }] }); h.render();
  h.pending[0](shared()); await task;
  assert.equal(h.revision.steps[0].sharedStepId, "shared");
  assert.equal(h.revision.steps[1].action, "Edited while loading");
  assert.equal(h.revision.description, "Latest description");
  assert.equal(h.render().pending, false);
});
test("a deleted insertion anchor cannot redirect the shared procedure to an unrelated row", async t => {
  const h = setup(t), task = h.render().insert(0, "shared");
  h.edit({ ...h.revision, steps: [] }); h.render(); h.pending[0](shared()); await task;
  assert.equal(h.revision.steps.length, 0); assert.equal(h.render().error, true);
});
test("unmounted editors ignore late shared procedure responses", async t => {
  const h = setup(t), task = h.render().insert(-1, "shared");
  h.h.dispose(); h.pending[0](shared()); await task;
  assert.equal(h.revision.steps[0].sharedStepId, undefined);
});
test("only the latest requested shared procedure may complete, and archived procedures are rejected", async t => {
  const h = setup(t), first = h.render().insert(-1, "shared");
  const second = h.render().insert(-1, "archived");
  h.pending[1]({ ...shared(), archivedAt: "now" }); await second;
  h.pending[0](shared()); await first;
  assert.equal(h.revision.steps[0].sharedStepId, undefined); assert.equal(h.render().error, true);
});

test("leaving edit mode cancels a pending insertion", async t => {
  const h = setup(t), task = h.render().insert(-1, "shared");
  h.stopEditing(); h.render(); h.pending[0](shared()); await task;
  assert.equal(h.revision.steps[0].sharedStepId, undefined); assert.equal(h.render().pending, false);
});
test("switching to a checklist cancels pending scenario insertion", async t => {
  const h = setup(t), task = h.render().insert(-1, "shared");
  h.edit({ ...h.revision, type: "checklist", steps: [] }); h.render(); h.pending[0](shared()); await task;
  assert.equal(h.revision.steps.length, 0); assert.equal(h.render().pending, false);
});
