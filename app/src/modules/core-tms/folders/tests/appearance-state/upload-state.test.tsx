import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { FolderAppearanceContext } from "../../state/appearance/folder-appearance-context";
import { useFolderAppearanceEditor } from "../../state/appearance-editor/useFolderAppearanceEditor";
import type { RepositoryFolder } from "../../model/folder";
const old = Object.getOwnPropertyDescriptor(globalThis, "React");
before(() => Object.assign(globalThis, { React }));
after(() => { if (old) Object.defineProperty(globalThis, "React", old); else Reflect.deleteProperty(globalThis, "React"); });
const folder = { id: "folder", workspaceId: "w", projectId: "p", appearance: null, etag: "v1", rowVersion: 1 } as RepositoryFolder;

test("a later icon or emoji choice cancels image upload and ignores its eventual completion", async t => {
  let editor!: ReturnType<typeof useFolderAppearanceEditor>, finish!: (id: string) => void, signal!: AbortSignal;
  const saved: unknown[] = [];
  function Probe() { editor = useFolderAppearanceEditor(folder); return null; }
  let view!: ReturnType<typeof create>;
  act(() => { view = create(<FolderAppearanceContext.Provider value={{ folders: [folder],
    upload: async (_folder, _file, _key, current) => { signal = current; return new Promise(resolve => { finish = resolve; }); },
    save: async (current, appearance) => { saved.push(appearance); return { ...current, appearance, etag: "v2", rowVersion: 2 }; },
  }}><Probe /></FolderAppearanceContext.Provider>); }); t.after(() => act(() => view.unmount()));
  let work!: Promise<void>; act(() => { work = editor.image(new File(["gif"], "x.gif", { type: "image/gif" })); });
  await act(async () => { editor.choose({ kind: "emoji", emoji: "🌿" }); await Promise.resolve(); }); assert.equal(signal.aborted, true);
  await act(async () => { finish("stale-image"); await work; });
  assert.deepEqual(saved, [{ kind: "emoji", emoji: "🌿" }]); assert.equal(editor.uploading, false);
});

test("upload retry preserves immutable operation identity and unmount aborts a pending image", async t => {
  let editor!: ReturnType<typeof useFolderAppearanceEditor>; const keys: string[] = []; const signals: AbortSignal[] = [];
  function Probe() { editor = useFolderAppearanceEditor(folder); return null; }
  let view!: ReturnType<typeof create>;
  act(() => { view = create(<FolderAppearanceContext.Provider value={{ folders: [folder],
    upload: async (_folder, _file, key, signal) => { keys.push(key); signals.push(signal); throw new Error("offline"); },
  }}><Probe /></FolderAppearanceContext.Provider>); }); t.after(() => act(() => view.unmount()));
  await act(async () => { await editor.image(new File(["gif"], "x.gif", { type: "image/gif" })); });
  assert.equal(editor.uploadFailed, true);
  await act(async () => { editor.retryUpload(); await Promise.resolve(); await Promise.resolve(); });
  assert.equal(keys.length, 2); assert.equal(keys[0], keys[1]);
  act(() => view.unmount()); assert.equal(signals[1]?.aborted, true);
});

test("an unchanged latest prop is reconciled after an older in-flight save settles", async t => {
  let editor!: ReturnType<typeof useFolderAppearanceEditor>, finish!: (value: RepositoryFolder) => void;
  const save = async () => new Promise<RepositoryFolder>(resolve => { finish = resolve; });
  function Probe({ value }: { value: RepositoryFolder }) { editor = useFolderAppearanceEditor(value); return null; }
  const render = (value: RepositoryFolder) => <FolderAppearanceContext.Provider value={{ folders: [value], save }}><Probe value={value} /></FolderAppearanceContext.Provider>;
  let view!: ReturnType<typeof create>; act(() => { view = create(render(folder)); }); t.after(() => act(() => view.unmount()));
  await act(async () => { editor.choose({ kind: "emoji", emoji: "🌿" }); await Promise.resolve(); });
  const latest: RepositoryFolder = { ...folder, rowVersion: 3, etag: "v3", appearance: { kind: "emoji", emoji: "🪐" } };
  act(() => view.update(render(latest)));
  await act(async () => finish({ ...folder, rowVersion: 2, etag: "v2", appearance: { kind: "emoji", emoji: "🌿" } }));
  assert.equal(editor.confirmed.etag, "v3"); assert.deepEqual(editor.preview, latest.appearance);
});
