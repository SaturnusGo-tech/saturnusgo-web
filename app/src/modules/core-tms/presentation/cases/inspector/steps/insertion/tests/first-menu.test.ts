import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../../portfolios/tests/support/component-harness";
import { createEmptyRevision } from "../../../../../../helpers/cases/caseRevision";
import type { InspectorSteps } from "../../InspectorSteps";
import type { useSharedStepInsertion } from "../useSharedStepInsertion";
import { insertSharedStepAfter } from "../insert-shared-step";
import { emptySharedStepDraft, type SharedStep } from "../../../../../../shared-steps/model/shared-step";
import type { TestCaseRevision } from "../../../../../../../../core/tms/contracts/legacy-contract";

test("scenario editor connects its beginning action to insertion before the first row", async t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const events: unknown[] = [];
  const loaded = h.load<{ InspectorSteps: typeof InspectorSteps }>(new URL("../../InspectorSteps.tsx", import.meta.url),
    name => name.endsWith("useSharedStepInsertion") ? { useSharedStepInsertion: () => ({
      insert: (index: number, id: string) => events.push([index, id]), pending: false, error: false,
    }) } : name.endsWith("CaseAttachmentDraftContext") ? { useCaseAttachmentDraft: () => null }
      : name.endsWith("../model") ? { canRemoveInspectorRow: (count: number) => count > 1 } : undefined);
  const render = (editing = true, checklist = false) => nodes(h.render(() => loaded.InspectorSteps({
    revision: { ...createEmptyRevision(), type: checklist ? "checklist" : "manual" }, editing, ru: false,
    sharedSteps: [], onResolveSharedStep: async () => null, onPatch() {},
  })));
  const start = render().find(node => node.type === "StepActionMenu" && node.props.trigger === "start")!;
  assert.ok(start); await invoke(start, "onInsertShared", "authentication");
  assert.deepEqual(events, [[-1, "authentication"]]);
  assert.ok(!render(false).some(node => node.type === "StepActionMenu"));
  assert.ok(!render(true, true).some(node => node.type === "StepActionMenu"));
});

test("beginning insertion preserves the row containing pending evidence from the editor context", async t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const insertion = h.load<{ useSharedStepInsertion: typeof useSharedStepInsertion }>(new URL("../useSharedStepInsertion.ts", import.meta.url),
    name => name.endsWith("insert-shared-step") ? { insertSharedStepAfter } : undefined);
  const revision = createEmptyRevision(), firstId = revision.steps[0].id;
  let finishPatch!: (value: TestCaseRevision) => void;
  const patchResult = new Promise<TestCaseRevision>(resolve => { finishPatch = resolve; });
  const value: SharedStep = { id: "shared", projectId: "p", folderId: null, folderPath: "/", currentRevision: 1,
    current: { ...emptySharedStepDraft(), title: "Sign in", revision: 1, createdBy: "qa", createdAt: "now" },
    revisionCount: 1, archivedAt: null, createdAt: "now", updatedAt: "now", etag: "v1" };
  const loaded = h.load<{ InspectorSteps: typeof InspectorSteps }>(new URL("../../InspectorSteps.tsx", import.meta.url),
    name => name.endsWith("useSharedStepInsertion") ? insertion
      : name.endsWith("CaseAttachmentDraftContext") ? { useCaseAttachmentDraft: () => ({ entries: [{ stepId: firstId }] }) }
        : name.endsWith("../model") ? { canRemoveInspectorRow: (count: number) => count > 1 } : undefined);
  const tree = nodes(h.render(() => loaded.InspectorSteps({ revision, editing: true, ru: false,
    sharedSteps: [], onResolveSharedStep: async () => value, onPatch: next => finishPatch({ ...revision, ...next }) })));
  const start = tree.find(node => node.type === "StepActionMenu" && node.props.trigger === "start")!;
  await invoke(start, "onInsertShared", "shared");
  const patched = await patchResult;
  assert.equal(patched.steps.length, 2);
  assert.equal(patched.steps[0].sharedStepId, "shared");
  assert.equal(patched.steps[1].id, firstId);
});
