import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../../portfolios/tests/support/component-harness";
import { createEmptyRevision } from "../../../../../../helpers/cases/caseRevision";
import type { InspectorSteps } from "../../InspectorSteps";

test("scenario editor connects its beginning action to insertion before the first row", async t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const events: unknown[] = [];
  const loaded = h.load<{ InspectorSteps: typeof InspectorSteps }>(new URL("../../InspectorSteps.tsx", import.meta.url),
    name => name.endsWith("useSharedStepInsertion") ? { useSharedStepInsertion: () => ({
      insert: (index: number, id: string) => events.push([index, id]), pending: false, error: false,
    }) } : name.endsWith("../model") ? { canRemoveInspectorRow: (count: number) => count > 1 } : undefined);
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
