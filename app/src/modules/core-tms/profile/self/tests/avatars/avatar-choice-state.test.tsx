import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useAvatarChoice } from "../../application/avatar/useAvatarChoice";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
test("avatar drafts do not apply until Save, failures retain selection, and success closes once", async () => {
  let state!: ReturnType<typeof useAvatarChoice>, view!: ReactTestRenderer, closed = 0, accepted = false;
  const saves: string[] = [];
  function Probe() { state = useAvatarChoice({ currentCharacterId: "mika", hasPhoto: false,
    onSave: async id => { saves.push(id); return accepted; }, onUpload: async () => true, onClose: () => { closed++; } }); return null; }
  await act(async () => { view = create(<Probe />); });
  assert.equal(state.selected, "mika"); assert.equal(state.changed, false);
  await act(async () => state.select("nora"));
  assert.deepEqual(saves, []); assert.equal(state.changed, true);
  await act(async () => state.save());
  assert.deepEqual(saves, ["nora"]); assert.equal(closed, 0); assert.equal(state.selected, "nora");
  accepted = true;
  await act(async () => state.save());
  assert.equal(closed, 1);
  await act(async () => view.unmount());
});

test("a custom photo is retained on cancel, and a pending upload or save cannot be submitted twice", async () => {
  let state!: ReturnType<typeof useAvatarChoice>, view!: ReactTestRenderer, closed = 0, uploads = 0;
  let complete!: (saved: boolean) => void;
  function Probe() { state = useAvatarChoice({ currentCharacterId: "mika", hasPhoto: true,
    onSave: async () => true, onUpload: async () => { uploads++; return new Promise(resolve => { complete = resolve; }); },
    onClose: () => { closed++; } }); return null; }
  await act(async () => { view = create(<Probe />); });
  assert.equal(state.selected, null); assert.equal(state.changed, false);
  const file = new Blob(["photo"], { type: "image/png" }) as File;
  await act(async () => { void state.upload(file); });
  assert.equal(state.working, true);
  await act(async () => { void state.upload(file); void state.save(); });
  assert.equal(uploads, 1); assert.equal(closed, 0);
  await act(async () => complete(false));
  assert.equal(state.working, false); assert.equal(closed, 0); assert.equal(state.selected, null);
  await act(async () => { void state.upload(file); });
  await act(async () => complete(true));
  assert.equal(closed, 1);
  await act(async () => view.unmount());
});
