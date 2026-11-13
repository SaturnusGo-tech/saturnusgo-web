import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes, type Node } from "../../../../portfolios/tests/support/component-harness";
import { emptySharedStepDraft } from "../../../../shared-steps/model/shared-step";
import type { SharedStepAttachmentEditor } from "../SharedStepAttachmentEditor";

function setup() {
  const h = componentHarness();
  const events: string[] = [];
  let registration: { id: string; dirty: boolean; busy?: boolean; revision?: string } | undefined;
  let intent: (() => void) | undefined;
  let saved = false;
  const assets = { entries: [] as unknown[], saving: false, locked: false, error: "", setEntries() {},
    save: async () => saved };
  const module = h.load<{ SharedStepAttachmentEditor: typeof SharedStepAttachmentEditor }>(new URL("../SharedStepAttachmentEditor.tsx", import.meta.url), name => {
    if (name.endsWith("useSharedStepAssetSave")) return { useSharedStepAssetSave: () => assets };
    if (name.endsWith("useAuthoringSession")) return { useAuthoringSession: (next: typeof registration) => {
      registration = next; return { release: () => events.push("released") };
    } };
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: (action: () => void) => {
      intent = action; return Promise.resolve(false);
    } };
  });
  const initial = { ...emptySharedStepDraft(), title: "Reusable sign-in", folderId: "auth" };
  let draft = initial;
  const render = () => nodes(h.render(() => module.SharedStepAttachmentEditor({ draft, current: null,
    resource: { attachmentsEnabled: true } as never, ru: false, onChange() {}, onClose: () => events.push("closed") })))
    .find((node: Node) => node.type === "SharedStepEditor")!;
  return { h, assets, events, render, registration: () => registration!, initial,
    change(value: typeof draft) { draft = value; }, approve: () => intent!(), saved(value: boolean) { saved = value; } };
}

test("shared-step sessions protect content, placement and attachments while clean and reverted drafts stay clean", () => {
  const f = setup(); f.render();
  assert.equal(f.registration()?.dirty, false, "opening a prefilled shared-step session is pristine");
  f.change({ ...f.initial, title: "Changed" }); f.render(); assert.equal(f.registration().dirty, true);
  f.change({ ...f.initial }); f.render(); assert.equal(f.registration().dirty, false);
  f.change({ ...f.initial, folderId: "billing" }); f.render(); assert.equal(f.registration().dirty, true);
  f.change(f.initial); f.assets.entries = [{ id: "first" }]; f.render(); assert.equal(f.registration().dirty, true);
  const revision = f.registration().revision;
  f.render(); assert.equal(f.registration().revision, revision);
  f.assets.entries = [{ id: "replacement" }]; f.render(); assert.notEqual(f.registration().revision, revision);
  f.assets.entries = []; f.render(); assert.equal(f.registration().dirty, false);
  f.assets.saving = true; f.render(); assert.equal(f.registration().busy, true);
  f.h.dispose();
});

test("shared-step cancel asks before running the close transition", () => {
  const f = setup(); f.render(); f.change({ ...f.initial, title: "Unsaved" });
  (f.render().props.onCancel as () => void)(); assert.deepEqual(f.events, [], "Stay preserves the editor");
  f.approve(); assert.deepEqual(f.events, ["closed"]); f.h.dispose();
});

test("shared-step save releases its session only after every upload succeeds, before closing", async () => {
  const f = setup(); f.render(); f.change({ ...f.initial, title: "Unsaved" });
  await (f.render().props.onSave as () => Promise<unknown>)(); assert.deepEqual(f.events, [], "failed or partial save remains protected");
  f.assets.locked = true; f.render(); assert.equal(f.registration().dirty, true);
  f.saved(true); await (f.render().props.onSave as () => Promise<unknown>)(); assert.deepEqual(f.events, ["released", "closed"]);
  f.h.dispose();
});
