import assert from "node:assert/strict";
import test from "node:test";
import { createNavigationContextStore } from "../navigation-context-store";

test("context survives reload and remains scoped to the history session and entry", () => {
  const values = new Map<string, string>();
  const storage = { read: (key: string) => values.get(key) ?? null, write: (key: string, value: string) => { values.set(key, value); } };
  const before = createNavigationContextStore(storage);
  const native = { session: "session-one", index: 3, context: { query: "old" } };
  before.write({ ...native, context: { query: "Payment", scroll: [{ top: 240 }] } });
  const after = createNavigationContextStore(storage);
  assert.deepEqual(after.read(native).context, { query: "Payment", scroll: [{ top: 240 }] });
  assert.deepEqual(after.read({ ...native, index: 2 }).context, { query: "old" });
  assert.deepEqual(after.read({ ...native, session: "session-two" }).context, { query: "old" });
});

test("blocked or full session storage does not crash navigation or lose this tab's latest context", () => {
  const store = createNavigationContextStore({
    read: () => { throw new DOMException("Storage blocked", "SecurityError"); },
    write: () => { throw new DOMException("Storage full", "QuotaExceededError"); },
  });
  const entry = { session: "session", index: 0, context: { query: "legacy" } };
  assert.deepEqual(store.read(entry).context, { query: "legacy" });
  store.write({ ...entry, context: { query: "current" } });
  assert.deepEqual(store.read(entry).context, { query: "current" });
});

test("malformed stored context falls back to the existing native history context", () => {
  for (const value of ["not JSON", "[]", "42", "null"]) {
    const store = createNavigationContextStore({ read: () => value, write: () => {} });
    const entry = { session: "session", index: 0, context: { query: "legacy" } };
    assert.deepEqual(store.read(entry), entry);
  }
});
