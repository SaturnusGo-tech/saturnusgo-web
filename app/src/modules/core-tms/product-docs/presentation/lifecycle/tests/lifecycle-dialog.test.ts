import assert from "node:assert/strict";
import test from "node:test";
import { invoke } from "../../../../portfolios/tests/support/component-harness";
import { productDocDraftKey } from "../../../state/draft/draft-buffer";
import { dialogFixture, flush, root, scope } from "./dialog-fixture";

test("fresh reader lifecycle metadata authorizes archive without publication permission or private draft reads", async t => {
  const f = dialogFixture(); t.after(f.h.dispose);
  assert.equal(f.confirm().props.isDisabled, true);
  assert.equal(f.reads[0][2]?.draft, false);
  await flush();
  const confirm = f.confirm(); assert.equal(Boolean(confirm.props.isDisabled), false);
  invoke(confirm, "onPress"); invoke(confirm, "onPress");
  assert.equal(f.operations.length, 1);
  assert.deepEqual(f.operations[0].input.expectedDraftVersion, 9);
  invoke(f.render().find(node => node.type === "ProductDocModal")!, "onClose");
  assert.equal(f.closed(), 0);
  f.operations[0].resolve(); await flush();
  invoke(confirm, "onPress");
  assert.equal(f.operations.length, 1, "retained controls cannot write again after success");
});

test("unpublished editor reads the authorized draft, while absent permission/version and wrong IDs fail closed", async t => {
  const draft = dialogFixture({ ...root, publishedVersion: null, version: null, canEdit: true }, "delete", true);
  t.after(draft.h.dispose); draft.render(); assert.equal(draft.reads[0][2]?.draft, true);
  for (const changed of [{ lifecycleVersion: undefined }, { lifecycleVersion: 0 }, { lifecycleVersion: -1 },
    { lifecycleVersion: 1.5 }, { id: "foreign" }, { canDelete: undefined }]) {
    const f = dialogFixture({ ...root, ...changed }, "delete"); t.after(f.h.dispose);
    f.render(); await flush(); const button = f.confirm();
    assert.equal(Boolean(button.props.isDisabled), true);
    invoke(button, "onPress"); assert.equal(f.operations.length, 0);
  }
});

test("privileged archived deletion uses archived metadata without the incompatible draft selector", async t => {
  const f = dialogFixture({ ...root, publishedVersion: null, version: null, archivedAt: "2026-11-13", canArchive: false }, "delete", true);
  t.after(f.h.dispose); f.render();
  assert.equal(f.reads[0][2]?.archived, true); assert.equal(f.reads[0][2]?.draft, undefined);
  await flush(); assert.equal(Boolean(f.confirm().props.isDisabled), false);
});

test("lost delete response retries the same version and idempotency key without discarding descendants", async t => {
  const f = dialogFixture(root, "delete"); t.after(f.h.dispose);
  const content = { title: "Unsaved", sections: [], baseline: { title: "Saved", sections: [], version: 1 } };
  for (const id of ["root", "child", "unrelated"]) f.drafts.set(productDocDraftKey(scope, id), content);
  f.render(); await flush();
  const first = f.confirm(); invoke(first, "onPress"); invoke(first, "onPress");
  assert.equal(f.operations.length, 1); assert.ok(f.operations[0].key);
  f.operations[0].reject(new Error("Response lost")); await flush();
  assert.equal(f.drafts.size, 3); assert.equal(f.completed.length, 0);
  invoke(f.confirm(), "onPress"); assert.equal(f.operations.length, 2);
  assert.equal(f.operations[1].key, f.operations[0].key);
  assert.equal(f.operations[1].input.expectedDraftVersion, 9);
  // A child could move out while the mutation is pending. It is never an inferred discard target.
  f.operations[1].resolve(); await flush();
  assert.deepEqual(Array.from(f.completed[0].affected), ["root"]);
  assert.equal(f.reads.length, 1, "do not infer a transactionally confirmed subtree from ancestry reads");
  assert.equal(f.drafts.size, 3, "the dialog only reports completion; the scoped owner applies it");
});

test("stale and revoked permission failures block retained controls and preserve edits", async t => {
  for (const code of ["PRODUCT_DOC_STALE_DRAFT", "PRODUCT_DOC_ACCESS_DENIED"]) {
    const f = dialogFixture(root, "delete"); t.after(f.h.dispose);
    f.render(); await flush(); const confirm = f.confirm(); invoke(confirm, "onPress");
    f.operations[0].reject({ code }); await flush(); f.render();
    invoke(confirm, "onPress"); assert.equal(f.operations.length, 1);
    assert.equal(f.completed.length, 0);
  }
});

test("scope changes reject retained actions and unmount ignores accepted late completion", async t => {
  const f = dialogFixture(root, "delete"); t.after(f.h.dispose);
  f.render(); await flush(); const old = f.confirm();
  f.render({ context: { ...f.props().context, scope: { workspaceId: "other", projectId: "other" } } });
  invoke(old, "onPress"); assert.equal(f.operations.length, 0);
  const pending = dialogFixture(root, "delete"); pending.render(); await flush();
  invoke(pending.confirm(), "onPress"); pending.h.dispose(); pending.operations[0].resolve(); await flush();
  assert.equal(pending.completed.length, 0);
  const closed = dialogFixture(root, "delete"); closed.render(); await flush();
  const confirm = closed.confirm(); closed.h.dispose(); invoke(confirm, "onPress");
  assert.equal(closed.operations.length, 0, "detached controls cannot start a mutation");
});

test("same-client subject changes invalidate fresh reads, retained confirms and accepted late results", async t => {
  const f = dialogFixture(root, "delete"); t.after(f.h.dispose);
  f.render({ context: { ...f.props().context, ownerId: "first" } }); await flush();
  const retained = f.confirm();
  f.render({ context: { ...f.props().context, ownerId: "second" } });
  assert.equal(f.reads[0][2]?.signal?.aborted, true);
  invoke(retained, "onPress"); assert.equal(f.operations.length, 0);
  await flush(); invoke(f.confirm(), "onPress");
  assert.equal(f.operations.length, 1);
  f.render({ context: { ...f.props().context, ownerId: "third" } });
  f.operations[0].resolve(); await flush();
  assert.equal(f.completed.length, 0);
});

test("Cancel uses the modal's animated dismissal contract before the owner closes", async t => {
  const f = dialogFixture(); t.after(f.h.dispose); f.render(); await flush();
  invoke(f.render().find(node => node.type === "Button" && node.props.children === "Cancel")!, "onPress");
  assert.equal(f.modalDismisses(), 1);
  assert.equal(f.closed(), 0, "the dialog must wait for ProductDocModal to finish dismissal");
});

test("a retained Cancel cannot begin the modal exit after a mutation starts", async t => {
  const f = dialogFixture(); t.after(f.h.dispose); f.render(); await flush();
  const view = f.render(), cancel = view.find(node => node.type === "Button" && node.props.children === "Cancel")!;
  invoke(f.confirm(), "onPress"); invoke(cancel, "onPress");
  assert.equal(f.modalDismisses(), 0);
  f.operations[0].resolve(); await flush();
});
