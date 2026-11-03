import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppearanceAutosave } from "../../application/appearance/appearance-autosave";
const frame = () => new Promise(resolve => setTimeout(resolve, 0));
const folder = { id: "a", etag: "v1", rowVersion: 1, appearance: null };

test("appearance choices coalesce and serialize with each confirmed ETag", async () => {
  const calls: { etag: string; appearance: unknown; resolve(value: any): void }[] = [];
  const queue = createAppearanceAutosave(folder as any, (current, appearance) => new Promise(resolve => calls.push({ etag: current.etag, appearance, resolve })), () => {}, () => "key");
  queue.choose({ kind: "emoji", emoji: "🌿" }); queue.choose({ kind: "emoji", emoji: "🚀" }); await frame();
  assert.equal(calls.length, 1); assert.deepEqual(calls[0]?.appearance, { kind: "emoji", emoji: "🚀" });
  queue.choose({ kind: "emoji", emoji: "🪐" }); queue.choose(null); await frame(); assert.equal(calls.length, 1);
  calls[0]?.resolve({ ...folder, etag: "v2", rowVersion: 2, appearance: calls[0].appearance }); await frame();
  assert.equal(calls[1]?.etag, "v2"); assert.equal(calls[1]?.appearance, null);
  calls[1]?.resolve({ ...folder, etag: "v3", rowVersion: 3 }); await frame(); assert.equal(queue.snapshot().busy, false);
  assert.equal(queue.snapshot().confirmed.etag, "v3");
});

test("failure rolls back preview, retries exact identity, and disposed navigation cannot publish stale completion", async () => {
  const keys: string[] = []; let reject!: (e: Error) => void; let resolve!: (value: any) => void; let published = 0;
  const queue = createAppearanceAutosave(folder as any, (_current, _appearance, key) => { keys.push(key); return new Promise((yes, no) => { resolve = yes; reject = no; }); }, () => published++, () => "stable-key");
  queue.choose({ kind: "emoji", emoji: "🐞" }); await frame(); reject(new Error("offline")); await frame();
  assert.equal(queue.snapshot().preview, null); assert.equal(queue.snapshot().error, "offline");
  queue.retry(); await frame(); assert.deepEqual(keys, ["stable-key", "stable-key"]);
  const before = published; queue.dispose(); resolve({ ...folder, etag: "v2", rowVersion: 2 }); await frame(); assert.equal(published, before);
});

test("a concurrency conflict rolls back to fresh server state and retry uses a new ETag and key", async () => {
  const { AppearanceConflict } = await import("../../application/appearance/appearance-conflict");
  const calls: { etag: string; key: string }[] = []; let sequence = 0;
  const queue = createAppearanceAutosave(folder as any, async (current, appearance, key) => {
    calls.push({ etag: current.etag, key });
    if (calls.length === 1) throw new AppearanceConflict("Changed by teammate", { ...folder, etag: "v7", rowVersion: 7 } as any);
    return { ...current, appearance, etag: "v8", rowVersion: 8 } as any;
  }, () => {}, () => `key-${++sequence}`);
  queue.choose({ kind: "emoji", emoji: "🌱" }); await frame(); assert.equal(queue.snapshot().confirmed.etag, "v7");
  queue.retry(); await frame(); assert.deepEqual(calls, [{ etag: "v1", key: "key-1" }, { etag: "v7", key: "key-2" }]);
});

test("an idle picker adopts refreshed server appearance without saving or erasing pending choices", async () => {
  let saves = 0; const queue = createAppearanceAutosave(folder as any, async current => { saves++; return current; }, () => {});
  assert.equal(queue.synchronize({ ...folder, etag: "v2", rowVersion: 2, appearance: { kind: "emoji", emoji: "🌸" } } as any), true);
  assert.deepEqual(queue.snapshot().preview, { kind: "emoji", emoji: "🌸" }); assert.equal(saves, 0);
  queue.choose({ kind: "emoji", emoji: "🌴" });
  assert.equal(queue.synchronize({ ...folder, etag: "v3", rowVersion: 3 } as any), false); queue.dispose();
});

test("a newer observed folder survives a delayed older save receipt and cannot be downgraded by stale props", async () => {
  let finish!: (value: any) => void;
  const initial = { ...folder, rowVersion: 1 } as any;
  const queue = createAppearanceAutosave(initial, async () => new Promise(resolve => { finish = resolve; }), () => {});
  queue.choose({ kind: "emoji", emoji: "🌿" }); await frame();
  const latest = { ...initial, rowVersion: 3, etag: "v3", appearance: { kind: "emoji", emoji: "🪐" } } as any;
  queue.synchronize(latest);
  finish({ ...initial, rowVersion: 2, etag: "v2", appearance: { kind: "emoji", emoji: "🌿" } }); await frame();
  assert.equal(queue.snapshot().confirmed.etag, "v3");
  assert.deepEqual(queue.snapshot().preview, latest.appearance);
  assert.equal(queue.synchronize(initial), false);
  assert.equal(queue.snapshot().confirmed.etag, "v3");
});

test("a queued choice still conflicts before overwriting an external version observed during the preceding save", async () => {
  const { AppearanceConflict } = await import("../../application/appearance/appearance-conflict");
  const calls: { folder: any; resolve(value: any): void; reject(error: Error): void }[] = [];
  const queue = createAppearanceAutosave(folder as any, (current) => new Promise((resolve, reject) => calls.push({ folder: current, resolve, reject })), () => {});
  queue.choose({ kind: "emoji", emoji: "🌿" }); await frame(); queue.choose({ kind: "emoji", emoji: "🌸" });
  const latest = { ...folder, rowVersion: 3, etag: "v3", appearance: { kind: "emoji", emoji: "🪐" } } as any;
  queue.synchronize(latest); calls[0]!.resolve({ ...folder, rowVersion: 2, etag: "v2" }); await frame();
  assert.equal(calls[1]?.folder.etag, "v2", "an observed external version cannot silently rebase a waiting write");
  calls[1]!.reject(new AppearanceConflict("Review changes", latest)); await frame();
  assert.equal(queue.snapshot().failed, true); assert.equal(queue.snapshot().confirmed.etag, "v3");
  queue.retry(); await frame(); assert.equal(calls[2]?.folder.etag, "v3");
  calls[2]!.resolve({ ...latest, rowVersion: 4, etag: "v4", appearance: { kind: "emoji", emoji: "🌸" } }); await frame();
  assert.equal(queue.snapshot().confirmed.etag, "v4");
});
