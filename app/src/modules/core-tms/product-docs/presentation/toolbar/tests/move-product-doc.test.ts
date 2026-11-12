import assert from "node:assert/strict";
import test from "node:test";
import { invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { copy, draft, flush, moveHarness, page, scope } from "./move-harness";

test("moving waits for the fresh editable draft and uses its version rather than the stale tree node", async t => {
  const f = moveHarness(); t.after(f.dispose);
  assert.equal(f.confirm().props.isDisabled, true);
  assert.deepEqual({ ...f.reads[0].args[0] }, scope); assert.equal(f.reads[0].args[1], page.id);
  assert.equal(f.reads[0].args[2]?.draft, true);
  f.chooseRoot(); f.submit(); assert.equal(f.moves.length, 0);
  f.reads[0].resolve(draft); await flush();
  assert.equal(f.confirm().props.isDisabled, false);
  f.submit();
  assert.equal(f.moves[0].args[0], scope); assert.equal(f.moves[0].args[1], page.id);
  assert.deepEqual({ ...f.moves[0].args[2] }, { parentId: null, expectedDraftVersion: 9 });
  f.moves[0].resolve({ draftVersion: 10 }); await flush();
  assert.deepEqual(f.callbacks, ["moved", "close"]);
  assert.equal(f.find("form").props["aria-busy"], false);
});

test("an unchanged parent cannot be submitted, including when the loaded draft parent differs from the tree", async t => {
  const f = moveHarness(); t.after(f.dispose); f.render();
  f.reads[0].resolve({ ...draft, parentId: null }); await flush();
  f.chooseRoot(); assert.equal(f.confirm().props.isDisabled, true);
  f.submit(); assert.equal(f.moves.length, 0); assert.deepEqual(f.callbacks, []);
});

test("a read-only draft disables and guards submission even after choosing a new destination", async t => {
  const f = moveHarness(); t.after(f.dispose); f.render();
  f.reads[0].resolve({ ...draft, canEdit: false }); await flush(); f.chooseRoot();
  assert.equal(f.confirm().props.isDisabled, true);
  f.submit(); assert.equal(f.moves.length, 0); assert.deepEqual(f.callbacks, []);
});

test("pending move prevents duplicate submissions and locks dismissal and destination controls", async t => {
  const f = moveHarness(); t.after(f.dispose); f.render(); f.reads[0].resolve(draft); await flush(); f.chooseRoot();
  const staleSubmit = f.find("form"); invoke(staleSubmit, "onSubmit", { preventDefault() {} });
  invoke(staleSubmit, "onSubmit", { preventDefault() {} }); f.submit();
  assert.equal(f.moves.length, 1);
  const pending = f.render();
  assert.equal(f.find("form").props["aria-busy"], true);
  assert.equal(f.confirm().props.isDisabled, true);
  assert.equal(f.find("Button", node => node.props.children === copy.cancel).props.isDisabled, true);
  assert.ok(pending.filter(node => node.type === "FolderChoiceRow").every(node => node.props.disabled === true));
  assert.equal(f.branch().props.saving, true);
  const modal = f.find("ProductDocModal"); assert.equal(modal.props.busy, true); invoke(modal, "onClose");
  assert.deepEqual(f.callbacks, []);
  f.moves[0].resolve({ draftVersion: 10 }); await flush();
  assert.deepEqual(f.callbacks, ["moved", "close"]);
});

test("a failed move keeps the dialog and destination, refreshes its draft and retries with the new version", async t => {
  const f = moveHarness(); t.after(f.dispose); f.render(); f.reads[0].resolve(draft); await flush(); f.chooseRoot(); f.submit();
  f.moves[0].reject(new Error("Version changed")); await flush();
  assert.equal(f.find("ErrorToast").props.message, copy.moveError);
  assert.deepEqual(f.callbacks, []); assert.equal(f.find("ProductDocModal").props.busy, false);
  assert.equal(f.find("FolderChoiceRow", node => node.props.name === copy.projectRoot).props.selected, true);
  assert.equal(f.reads.length, 2); assert.equal(f.confirm().props.isDisabled, true);
  f.reads[1].resolve({ ...draft, draftVersion: 12 }); await flush(); f.submit();
  assert.equal(f.moves[1].args[2].expectedDraftVersion, 12);
  assert.equal(f.find("ErrorToast").props.message, "");
  f.moves[1].resolve({ draftVersion: 13 }); await flush(); assert.deepEqual(f.callbacks, ["moved", "close"]);
});

test("an unpublished parent has its actionable error and no success or close callback", async t => {
  const f = moveHarness(); t.after(f.dispose); f.render(); f.reads[0].resolve(draft); await flush(); f.chooseRoot(); f.submit();
  f.moves[0].reject({ code: "PRODUCT_DOC_PARENT_UNPUBLISHED" }); await flush();
  assert.equal(f.find("ErrorToast").props.message, copy.unpublishedParent); assert.deepEqual(f.callbacks, []);
});

test("the destination branch excludes the source and its entire expanded subtree", t => {
  const f = moveHarness(); t.after(f.dispose);
  f.listing.data.nodes = [page, { ...page, id: "other", title: "Other parent" }];
  const branch = f.branch();
  const output = nodes(branch.type({ ...branch.props, open: new Set([page.id, "other"]) }));
  assert.deepEqual(output.filter(node => node.type === "FolderChoiceRow").map(node => node.props.name), ["Other parent"]);
  const nested = output.filter(node => typeof node.type === "function");
  assert.deepEqual(nested.map(node => node.props.parentId), ["other"]);
  assert.equal(f.branches[0][1], scope);
  assert.deepEqual({ ...f.branches[0][2] as object }, { parentId: null, refresh: 0, draft: true });
});

test("the destination picker supports keyboard navigation and expand/collapse without changing selection", t => {
  const f = moveHarness(); t.after(f.dispose); const focus: string[] = []; let expanded = false, clicks = 0;
  const toggle = { getAttribute: () => String(expanded), click: () => { expanded = !expanded; clicks++; } };
  const first = { focus: () => focus.push("first"), parentElement: { querySelector: () => toggle } };
  const last = { focus: () => focus.push("last"), parentElement: { querySelector: () => undefined } };
  const options = [first, last];
  const picker = f.find("div", node => node.props.role === "listbox");
  const key = (key: string, target: typeof first | typeof last = first) => invoke(picker, "onKeyDown", {
    key, target, currentTarget: { querySelectorAll: () => options }, preventDefault() {},
  });
  key("ArrowDown"); key("ArrowUp", last); key("End"); key("Home", last);
  assert.deepEqual(focus, ["last", "first", "last", "first"]);
  key("ArrowRight"); assert.equal(expanded, true);
  key("ArrowRight"); assert.equal(clicks, 1);
  key("ArrowLeft"); assert.equal(expanded, false); assert.equal(clicks, 2);
  assert.deepEqual(f.callbacks, []); assert.equal(f.moves.length, 0);
});
