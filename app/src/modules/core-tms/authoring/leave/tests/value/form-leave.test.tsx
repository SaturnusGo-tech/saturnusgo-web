import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import type { useFormLeave } from "../../state/value/useFormLeave";

function fixture() {
  const h = componentHarness();
  let session: { dirty: boolean; busy?: boolean; id: string; revision?: string } | undefined;
  let released = 0, accepted = false, prompts = 0;
  const { useFormLeave: useLeave } = h.load<{ useFormLeave: typeof useFormLeave }>(new URL("../../state/value/useFormLeave.ts", import.meta.url), name => {
    if (name.endsWith("useAuthoringSession")) return { useAuthoringSession: (next: typeof session) => {
      session = next; return { release: () => { released++; } };
    } };
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: async (action: () => void) => {
      if (session?.busy) return false;
      if (session?.dirty) { prompts++; if (!accepted) return false; }
      action(); return true;
    } };
    return undefined;
  });
  return { h, render: (value: unknown, options = {}) => h.render(() => useLeave(value, options)),
    session: () => session, released: () => released, prompts: () => prompts,
    approve: () => { accepted = true; } };
}

test("prefilled and reverted forms leave immediately, changed forms require confirmation", async t => {
  const f = fixture(); t.after(() => f.h.dispose()); let closes = 0;
  let state = f.render({ title: "From run", actual: "Observed", priority: "high" });
  assert.equal(state.dirty, false); await state.close(() => { closes++; }); assert.equal(closes, 1);
  state = f.render({ title: "Edited", actual: "Observed", priority: "high" });
  assert.equal(f.session()?.dirty, true); await state.close(() => { closes++; }); assert.equal(closes, 1);
  f.approve(); await state.close(() => { closes++; }); assert.equal(closes, 2);
  state = f.render({ title: "From run", actual: "Observed", priority: "high" });
  assert.equal(state.dirty, false); assert.equal(f.prompts(), 2);
});

test("attachments and user routing count as changes while an active save blocks dismissal", async t => {
  const f = fixture(); t.after(() => f.h.dispose()); let closes = 0;
  f.render({ title: "" });
  let state = f.render({ title: "" }, { extraDirty: true });
  assert.equal(state.dirty, true);
  state = f.render({ title: "" }, { extraDirty: false, busy: true });
  f.approve(); assert.equal(await state.close(() => { closes++; }), false); assert.equal(closes, 0);
  state = f.render({ title: "" }); assert.equal(state.dirty, false);
});

test("successful save releases before its completion callback and starts a fresh baseline for another comment", async t => {
  const f = fixture(); t.after(() => f.h.dispose());
  f.render({ body: "" }); const changed = f.render({ body: "Ready" });
  const previousId = f.session()?.id; changed.reset({ body: "Ready" });
  assert.equal(f.released(), 1);
  const saved = f.render({ body: "Ready" }); assert.equal(saved.dirty, false);
  assert.notEqual(f.session()?.id, previousId);
  assert.equal(f.render({ body: "Another note" }).dirty, true);
});

test("semantic revision distinguishes later edits and supplemental attachment changes", t => {
  const f = fixture(); t.after(() => f.h.dispose());
  f.render({ body: "" }); f.render({ body: "First edit" });
  const first = f.session()?.revision;
  f.render({ body: "First edit" }); assert.equal(f.session()?.revision, first, "rerenders do not invalidate approval");
  f.render({ body: "Second edit" }); assert.notEqual(f.session()?.revision, first);
  const second = f.session()?.revision;
  f.render({ body: "Second edit" }, { extraDirty: true, revision: ["file-one"] });
  const attachment = f.session()?.revision; assert.notEqual(attachment, second);
  f.render({ body: "Second edit" }, { extraDirty: true, revision: ["file-two"] });
  assert.notEqual(f.session()?.revision, attachment, "replacing an attachment needs a fresh approval");
});
