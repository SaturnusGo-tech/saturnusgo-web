import assert from "node:assert/strict";
import test from "node:test";
import { AuthoringLeaveCoordinator } from "../../application/leave-coordinator";

function fixture(initiallyDirty = false) {
  const leave = new AuthoringLeaveCoordinator(); let finish!: (value: boolean) => void;
  const draft = { dirty: initiallyDirty, busy: false, revision: "initial" };
  const prompts: string[] = []; let approvals = 0, moved = false;
  leave.register("case", () => ({ ...draft }));
  let unsavedDoc = true;
  leave.register("docs", () => ({ dirty: unsavedDoc, beforeLeave: () => new Promise<boolean>(resolve => {
    finish = ok => { unsavedDoc = !ok; resolve(ok); };
  }) }));
  leave.setPresenter(async kind => { prompts.push(kind); return kind === "discard" && approvals-- > 0; });
  return { leave, draft, prompts, move: () => { moved = true; }, moved: () => moved,
    finish: () => finish(true), approve(count: number) { approvals = count; } };
}

test("a form dirtied during documentation autosave is checked before navigation", async () => {
  const f = fixture(); const leaving = f.leave.request(f.move);
  f.draft.dirty = true; f.draft.revision = "late text"; f.finish();
  assert.equal(await leaving, false); assert.deepEqual(f.prompts, ["discard"]);
  assert.equal(f.moved(), false);
});

test("a write started during documentation autosave blocks the final commit", async () => {
  const f = fixture(); const leaving = f.leave.request(f.move);
  f.draft.busy = true; f.finish();
  assert.equal(await leaving, false); assert.deepEqual(f.prompts, ["busy"]);
  assert.equal(f.moved(), false);
});

test("an unchanged approved draft needs one confirmation across an asynchronous autosave", async () => {
  const f = fixture(true); f.approve(1); const leaving = f.leave.request(f.move);
  await Promise.resolve(); f.finish();
  assert.equal(await leaving, true); assert.deepEqual(f.prompts, ["discard"]);
  assert.equal(f.moved(), true);
});

test("new text after confirmation needs a fresh approval instead of reusing the old approval", async () => {
  const f = fixture(true); f.approve(1); const leaving = f.leave.request(f.move);
  await Promise.resolve(); f.draft.revision = "text after confirmation"; f.finish();
  assert.equal(await leaving, false); assert.deepEqual(f.prompts, ["discard", "discard"]);
  assert.equal(f.moved(), false);
});

test("an editor mounted during autosave cannot bypass confirmation", async () => {
  const f = fixture(); const leaving = f.leave.request(f.move);
  f.leave.register("new-comment", () => ({ dirty: true, revision: "late comment" })); f.finish();
  assert.equal(await leaving, false); assert.deepEqual(f.prompts, ["discard"]);
  assert.equal(f.moved(), false);
});

test("documentation changed while another draft saves is flushed again before leaving", async () => {
  const leave = new AuthoringLeaveCoordinator(); let dirty = true, revision = 0, saves = 0;
  let finish!: (value: boolean) => void;
  leave.register("first-doc", () => ({ dirty, revision, beforeLeave: async () => { saves++; dirty = false; return true; } }));
  leave.register("second-doc", () => ({ dirty: true, beforeLeave: () => new Promise<boolean>(resolve => { finish = resolve; }) }));
  const leaving = leave.request(() => { assert.equal(dirty, false); });
  await Promise.resolve(); dirty = true; revision++; finish(true);
  assert.equal(await leaving, true); assert.equal(saves, 2);
});
