import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { emptySharedStepDraft, type SharedStepDraft } from "../../../../shared-steps/model/shared-step";
import type { SharedStepPlacement } from "../SharedStepPlacement";

function setup(t: TestContext, overrides: Partial<Parameters<typeof SharedStepPlacement>[0]> = {}) {
  const h = componentHarness(); t.after(() => h.dispose());
  const events: SharedStepDraft[] = [];
  const { SharedStepPlacement: Placement } = h.load<{ SharedStepPlacement: typeof SharedStepPlacement }>(
    new URL("../SharedStepPlacement.tsx", import.meta.url));
  const tree = nodes(h.render(() => Placement({ draft: { ...emptySharedStepDraft(), folderId: "archived" },
    currentPath: "/Host/Authentication", folders: [], ru: false, onChange: value => events.push(value), ...overrides })));
  return { events, pick: (path: string) => invoke(tree.find(node => node.type === "FolderPathPicker")!, "onChange", path) };
}

test("reselecting a placement omitted from active folders preserves its stable ID", t => {
  const h = setup(t); h.pick("/Host/Authentication");
  assert.equal(h.events[h.events.length - 1]?.folderId, "archived");
});

test("a new folder reusing the old path cannot silently replace the saved folder ID", t => {
  const h = setup(t, { folders: [{ id: "replacement", path: "/Host/Authentication" }] });
  h.pick("/Host/Authentication"); assert.equal(h.events[h.events.length - 1]?.folderId, "archived");
});

test("unknown paths preserve the draft instead of clearing placement", t => {
  const h = setup(t); h.pick("/Unknown"); assert.equal(h.events.length, 0);
});

test("choosing another active folder or project root changes placement explicitly", t => {
  const h = setup(t, { folders: [{ id: "payments", path: "/Payments" }] });
  h.pick("/Payments"); h.pick("/");
  assert.deepEqual(h.events.map(value => value.folderId), ["payments", null]);
});
