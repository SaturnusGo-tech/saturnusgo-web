import assert from "node:assert/strict";
import test from "node:test";
import { DESKTOP_ATTEMPT_KEY, captureDesktopAttempt, takeDesktopAttempt } from "../../desktop/attempt-storage";
const origin = "https://tms.example.test", attempt = "a".repeat(43), now = 1_000_000;
function store() {
  const values = new Map<string, string>();
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
const location = (path: string) => new URL(path, origin);
void test("desktop attempt persists across auth entry changes without refreshing TTL and consumes once", () => {
  const storage = store();
  assert.equal(captureDesktopAttempt(storage, location(`/cloud-login/?desktopAttempt=${attempt}`), now).status, "active");
  const original = storage.getItem(DESKTOP_ATTEMPT_KEY);
  assert.equal(captureDesktopAttempt(storage, location("/signup/"), now + 500).status, "active");
  captureDesktopAttempt(storage, location(`/login/?desktopAttempt=${attempt}`), now + 1000);
  assert.equal(storage.getItem(DESKTOP_ATTEMPT_KEY), original);
  assert.deepEqual(takeDesktopAttempt(storage, origin, now + 2000), { status: "redirect", path: `/api/v1/auth/desktop/authorize?attempt=${attempt}` });
  assert.deepEqual(takeDesktopAttempt(storage, origin, now + 2000), { status: "none" });
});
void test("malformed and duplicate incoming attempts clear old context, and external returns never become a target", () => {
  for (const search of [`desktopAttempt=${attempt}&desktopAttempt=${attempt}`, "desktopAttempt=short", `desktopAttempt=${"a".repeat(44)}`, "desktopAttempt=https://evil.example/"]) {
    const storage = store(); captureDesktopAttempt(storage, location(`/signup/?desktopAttempt=${attempt}`), now);
    assert.equal(captureDesktopAttempt(storage, location(`/login/?${search}`), now + 1).status, "blocked");
    assert.equal(storage.getItem(DESKTOP_ATTEMPT_KEY), null);
  }
  const storage = store();
  captureDesktopAttempt(storage, location(`/signup/?desktopAttempt=${attempt}&returnTo=https://evil.example/&code=secret`), now);
  assert.deepEqual(takeDesktopAttempt(storage, origin, now), { status: "redirect", path: `/api/v1/auth/desktop/authorize?attempt=${attempt}` });
});
void test("origin mismatch, future and expired records fail closed; only explicit managed landing allows workspace capture", () => {
  for (const createdAt of [now + 1, now - 300_000]) {
    const storage = store(); storage.setItem(DESKTOP_ATTEMPT_KEY, JSON.stringify({ version: 1, origin, attempt, createdAt }));
    assert.deepEqual(takeDesktopAttempt(storage, origin, now), { status: "blocked" });
    assert.equal(storage.getItem(DESKTOP_ATTEMPT_KEY), null);
  }
  const storage = store(); captureDesktopAttempt(storage, location(`/login/?desktopAttempt=${attempt}`), now);
  assert.deepEqual(takeDesktopAttempt(storage, "https://other.example.test", now), { status: "blocked" });
  assert.equal(captureDesktopAttempt(storage, location(`/testcases/umbrella-home/work/?desktopAttempt=${attempt}`), now).status, "none");
  assert.equal(captureDesktopAttempt(storage, location(`/testcases/umbrella-home/work/?desktopAttempt=${attempt}`), now, true).status, "active");
  const outside = store();
  assert.equal(captureDesktopAttempt(outside, location(`/elsewhere/?desktopAttempt=${attempt}`), now, true).status, "none");
  assert.equal(outside.values.size, 0);
});
void test("a fresh native attempt replaces expired context without reviving the same expired attempt", () => {
  const storage = store(); captureDesktopAttempt(storage, location(`/login/?desktopAttempt=${attempt}`), now);
  assert.equal(captureDesktopAttempt(storage, location(`/login/?desktopAttempt=${attempt}`), now + 300_000).status, "blocked");
  const second = store(); captureDesktopAttempt(second, location(`/login/?desktopAttempt=${attempt}`), now);
  const fresh = "b".repeat(43);
  assert.equal(captureDesktopAttempt(second, location(`/signup/?desktopAttempt=${fresh}`), now + 300_000).status, "active");
  assert.deepEqual(takeDesktopAttempt(second, origin, now + 300_001), { status: "redirect", path: `/api/v1/auth/desktop/authorize?attempt=${fresh}` });
});
