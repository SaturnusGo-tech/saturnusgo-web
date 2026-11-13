import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { DefectSharedReproduction } from "../../reproduction/DefectSharedReproduction";
import type { SharedStepSummary } from "../../../../../shared-steps/model/shared-step";

test("manual shared chooser emits stable immutable references and preserves user order", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { DefectSharedReproduction: View } = h.load<{ DefectSharedReproduction: typeof DefectSharedReproduction }>(new URL("../../reproduction/DefectSharedReproduction.tsx", import.meta.url));
  const items = [{ id: "a", title: "Sign in", currentRevision: 3 }, { id: "b", title: "Pay", currentRevision: 7 }] as SharedStepSummary[];
  let value: { sharedStepId: string; revision: number }[] = [];
  const render = () => nodes(h.render(() => View({ value, choices: { folders: [], sharedSteps: items }, ru: false, disabled: false,
    onChange: next => { value = [...next]; } })));
  invoke(render().find(node => node.type === "SharedStepChooser")!, "onSelect", "b");
  invoke(render().find(node => node.type === "SharedStepChooser")!, "onSelect", "a");
  assert.deepEqual(JSON.parse(JSON.stringify(value)), [{ sharedStepId: "b", revision: 7 }, { sharedStepId: "a", revision: 3 }]);
  invoke(render().find(node => node.props["aria-label"] === "Move up: Sign in")!, "onPress");
  assert.deepEqual(JSON.parse(JSON.stringify(value)), [{ sharedStepId: "a", revision: 3 }, { sharedStepId: "b", revision: 7 }]);
  invoke(render().find(node => node.props["aria-label"] === "Remove: Sign in")!, "onPress");
  assert.equal(value.length, 1); assert.equal(value[0].sharedStepId, "b");
});

test("manual scenario selection stops at the server limit of twenty references", t => {
  const h = componentHarness(); t.after(() => h.dispose()); let changed = false;
  const { DefectSharedReproduction: View } = h.load<{ DefectSharedReproduction: typeof DefectSharedReproduction }>(new URL("../../reproduction/DefectSharedReproduction.tsx", import.meta.url));
  const items = [{ id: "a", title: "Sign in", currentRevision: 3 }] as SharedStepSummary[];
  const value = Array.from({ length: 20 }, () => ({ sharedStepId: "a", revision: 3 }));
  const tree = nodes(h.render(() => View({ value, choices: { folders: [], sharedSteps: items }, ru: false, disabled: false,
    onChange: () => { changed = true; } })));
  assert.equal(tree.find(node => node.type === "PropertyPopover")?.props.disabled, true);
  invoke(tree.find(node => node.type === "SharedStepChooser")!, "onSelect", "a");
  assert.equal(changed, false);
});
