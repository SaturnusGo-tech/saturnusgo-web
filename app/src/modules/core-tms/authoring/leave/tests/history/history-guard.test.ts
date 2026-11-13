import assert from "node:assert/strict";
import test from "node:test";
import { AuthoringHistoryGuard } from "../../../../state/navigation/browser/guard/authoring-history-guard";

test("Back restores the current URL before asking and Stay preserves forward history", async () => {
  let position = 2; const movements: number[] = []; let approve!: (value: boolean) => void; let stopped = 0;
  const guard = new AuthoringHistoryGuard({ dispatch: () => assert.fail("indexed history uses native replay"), read: () => ({ href: `page-${position}`, index: position, session: "s" }),
    changed: () => true, go: delta => { movements.push(delta); position += delta; },
    replace: () => assert.fail("must keep browser history"),
    request: () => new Promise(resolve => { approve = resolve; }) });
  position = 1; guard.capture({ stopImmediatePropagation() { stopped++; } });
  assert.equal(position, 2); assert.equal(stopped, 1);
  guard.capture({ stopImmediatePropagation() { stopped++; } });
  await Promise.resolve(); approve(false); await Promise.resolve();
  assert.deepEqual(movements, [1]); assert.equal(position, 2);
});

test("confirmed Back/Forward replays the original destination exactly once", async () => {
  let position = 2; let changes = true; let restored = 0;
  const guard = new AuthoringHistoryGuard({ dispatch: () => assert.fail("indexed history uses native replay"), read: () => ({ href: `page-${position}`, index: position, session: "s" }),
    changed: () => changes, go: delta => { position += delta; }, replace: () => assert.fail(), request: async action => { action(); return true; } });
  position = 1; guard.capture({ stopImmediatePropagation() {} });
  guard.capture({ stopImmediatePropagation() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(position, 1);
  guard.capture({ stopImmediatePropagation() { assert.fail("approved history must propagate"); } }); restored++;
  changes = false; position = 2;
  guard.capture({ stopImmediatePropagation() { assert.fail(); } }); restored++;
  assert.equal(restored, 2);
});


test("an approved programmatic history entry propagates its synthetic popstate once", () => {
  let href = "old"; let requested = 0;
  const guard = new AuthoringHistoryGuard({ dispatch: () => assert.fail("indexed history uses native replay"), read: () => ({ href, index: 1, session: "s" }), changed: () => true,
    go: () => assert.fail("same entry must not rewind"), replace: () => assert.fail("same entry must not replace"),
    request: async () => { requested++; return false; } });
  href = "approved"; guard.record();
  guard.capture({ stopImmediatePropagation: () => assert.fail("resource listeners must receive approved synthetic popstate") });
  assert.equal(requested, 0);
});

test("history without Falcon indices restores only after approval and replays to resource listeners", async () => {
  for (const approved of [false, true]) {
    let href = "editor"; let dispatched = 0; let stopped = 0;
    const guard = new AuthoringHistoryGuard({ read: () => ({ href }), changed: () => true,
      go: () => assert.fail("unknown history must not guess a delta"), replace: position => { href = position.href; },
      request: async action => { if (approved) action(); return approved; },
      dispatch: () => { dispatched++; guard.capture({ stopImmediatePropagation: () => assert.fail("approved replay must reach resources") }); },
    });
    href = "unindexed-destination"; guard.capture({ stopImmediatePropagation() { stopped++; } });
    assert.equal(href, "editor", "the original editor stays active during confirmation");
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(href, approved ? "unindexed-destination" : "editor");
    assert.equal(stopped, 1); assert.equal(dispatched, approved ? 1 : 0);
  }
});

test("Back between duplicate URLs still protects the editor because history indices differ", async () => {
  let index = 2; let stopped = 0; let prompts = 0;
  const guard = new AuthoringHistoryGuard({ read: () => ({ href: "same", index, session: "s" }), changed: () => true,
    go: delta => { index += delta; }, replace: () => assert.fail(), dispatch: () => assert.fail(),
    request: async () => { prompts++; return false; } });
  index = 1; guard.capture({ stopImmediatePropagation() { stopped++; } });
  assert.equal(stopped, 1); assert.equal(index, 2);
  guard.capture({ stopImmediatePropagation() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(prompts, 1); assert.equal(index, 2);
});
