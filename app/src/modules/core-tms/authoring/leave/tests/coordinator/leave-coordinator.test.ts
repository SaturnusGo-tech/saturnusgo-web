import assert from "node:assert/strict";
import test from "node:test";
import { AuthoringLeaveCoordinator } from "../../application/leave-coordinator";

test("a clean editor leaves without an interruption", async () => {
  const leave = new AuthoringLeaveCoordinator(); let navigated = 0;
  leave.register("case", () => ({ dirty: false }));
  assert.equal(await leave.request(() => { navigated++; }), true);
  assert.equal(navigated, 1);
});

test("dirty data stays until the user confirms the entire navigation intent", async () => {
  const leave = new AuthoringLeaveCoordinator(); let navigated = 0;
  leave.register("case", () => ({ dirty: true }));
  leave.setPresenter(async () => false);
  assert.equal(await leave.request(() => { navigated++; }), false);
  assert.equal(navigated, 0);
  leave.setPresenter(async () => true);
  assert.equal(await leave.request(() => { navigated++; }), true);
  assert.equal(navigated, 1);
});

test("a dirty editor without a confirmation host fails closed", async () => {
  const leave = new AuthoringLeaveCoordinator(); leave.register("case", () => ({ dirty: true }));
  assert.equal(await leave.request(() => assert.fail("must stay")), false);
});

test("documentation saves before a navigation and a failed save keeps the page", async () => {
  const leave = new AuthoringLeaveCoordinator(); const events: string[] = []; let ok = false;
  leave.register("docs", () => ({ dirty: true, beforeLeave: async () => { events.push("save"); return ok; } }));
  assert.equal(await leave.request(() => { events.push("navigate"); }), false);
  ok = true;
  assert.equal(await leave.request(() => { events.push("navigate"); }), true);
  assert.deepEqual(events, ["save", "save", "navigate"]);
});

test("a pending write or duplicate navigation cannot discard an editor", async () => {
  const leave = new AuthoringLeaveCoordinator(); let busy = true; let approve!: (value: boolean) => void;
  leave.register("case", () => ({ dirty: true, busy }));
  leave.setPresenter(kind => kind === "busy" ? Promise.resolve(false) : new Promise(resolve => { approve = resolve; }));
  assert.equal(await leave.request(() => assert.fail("saving")), false);
  busy = false;
  const first = leave.request(() => {});
  assert.equal(await leave.request(() => assert.fail("duplicate")), false);
  approve(false); assert.equal(await first, false);
});

test("one approval covers nested navigation and successful saves release synchronously", async () => {
  const leave = new AuthoringLeaveCoordinator(); let prompts = 0; let navigated = 0;
  const release = leave.register("case", () => ({ dirty: true }));
  leave.setPresenter(async () => { prompts++; return true; });
  await leave.request(async () => { await leave.request(() => { navigated++; }); });
  assert.equal(prompts, 1); assert.equal(navigated, 1);
  release(); assert.equal(leave.hasChanges(), false);
  await leave.request(() => { navigated++; }); assert.equal(prompts, 1);
});

test("replacing a mounted session cannot be removed by the old cleanup", () => {
  const leave = new AuthoringLeaveCoordinator();
  const releaseOld = leave.register("case", () => ({ dirty: false }));
  leave.register("case", () => ({ dirty: true })); releaseOld();
  assert.equal(leave.hasChanges(), true);
});

test("an approved async transition cannot authorize unrelated clicks while loading", async () => {
  const leave = new AuthoringLeaveCoordinator(); let finish!: () => void;
  leave.register("case", () => ({ dirty: true })); leave.setPresenter(async () => true);
  const first = leave.request(() => new Promise<void>(resolve => { finish = resolve; }));
  await Promise.resolve();
  assert.equal(leave.shouldWarnOnUnload(), false);
  assert.equal(await leave.request(() => assert.fail("unrelated navigation")), false);
  finish(); await first;
  assert.equal(leave.shouldWarnOnUnload(), true);
});


test("an approved delayed animation commit reenters only its own navigation without another prompt", async () => {
  const leave = new AuthoringLeaveCoordinator(); let prompts = 0; let navigated = 0; let frame!: () => void;
  leave.register("case", () => ({ dirty: true })); leave.setPresenter(async () => { prompts++; return true; });
  const first = leave.request(commit => new Promise<void>(resolve => { frame = () => {
    commit(() => { void leave.request(() => { navigated++; }); }); resolve();
  }; }));
  await Promise.resolve();
  assert.equal(await leave.request(() => assert.fail("unrelated click")), false);
  assert.doesNotThrow(() => frame());
  assert.equal(await first, true); assert.equal(navigated, 1); assert.equal(prompts, 1);
});
