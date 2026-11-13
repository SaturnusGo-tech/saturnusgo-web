import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../../../core/tms/transport/http";
import { useSelfProfileIdentity } from "../useSelfProfileIdentity";

const fallback = { name: "Original", hasAvatar: false, version: 0 };
const avatar = { url: "https://media.example.test/avatar", expiresAt: "2099-01-01T00:00:00Z" };
const self = { name: "Pat QA", hasAvatar: true, version: 4, avatar, accountKind: "personal" };
type IdentityState = ReturnType<typeof useSelfProfileIdentity>;
function client(read: (path: string, signal?: AbortSignal) => Promise<unknown>): TmsHttpClient {
  return { getResource: read } as TmsHttpClient;
}

void test("shell restores saved profile and reuses its avatar grant across avatar instances", async () => {
  let state!: IdentityState, reads = 0, renderer!: ReactTestRenderer;
  const http = client(async path => { assert.equal(path, "/me/profile"); reads++; return { data: self }; });
  function Probe() { state = useSelfProfileIdentity(http, "personal:pat", fallback); return null; }
  await act(async () => { renderer = create(<Probe />); });
  assert.deepEqual(state.profile, { name: "Pat QA", hasAvatar: true, version: 4 });
  assert.equal(state.accountKind, "personal");
  const signal = new AbortController().signal;
  assert.deepEqual(await state.avatarLoader(signal), avatar);
  assert.deepEqual(await state.avatarLoader(signal), avatar);
  assert.equal(reads, 1, "one profile hydration supplies both shell avatar renders");
  await act(async () => renderer.unmount());
});

void test("a saved edit cannot be overwritten by earlier hydration and refreshes avatar grants", async () => {
  let state!: IdentityState, resolve!: (value: unknown) => void, renderer!: ReactTestRenderer, reads = 0;
  const fresh = { ...self, name: "Updated", version: 5, avatar: { ...avatar, url: "https://media.example.test/new-avatar" } };
  const http = client(async () => {
    reads++;
    return reads === 1 ? new Promise(value => { resolve = value; }) : { data: fresh };
  });
  function Probe() { state = useSelfProfileIdentity(http, "personal:pat", fallback); return null; }
  await act(async () => { renderer = create(<Probe />); });
  assert.equal(state.profile.name, "Original");
  await act(async () => state.updateProfile({ name: "Updated", hasAvatar: true, version: 5 }));
  await act(async () => resolve({ data: self }));
  assert.equal(state.profile.name, "Updated");
  assert.equal(state.profile.version, 5);
  assert.deepEqual(await state.avatarLoader(new AbortController().signal), fresh.avatar);
  assert.equal(reads, 2);
  await act(async () => renderer.unmount());
});

void test("optional hydration never blocks access, and changing account cannot leak old identity", async () => {
  let state!: IdentityState, renderer!: ReactTestRenderer, reads = 0;
  const http = client(async () => { reads++; if (reads === 1) return { data: self }; throw new Error("Unavailable"); });
  function Probe({ subject, active = true }: { subject: string; active?: boolean }) {
    state = useSelfProfileIdentity(http, subject, fallback, active); return <div data-name={state.profile.name} />;
  }
  await act(async () => { renderer = create(<Probe subject="pat" active={false} />); });
  assert.equal(reads, 0);
  await act(async () => renderer.update(<Probe subject="pat" />));
  assert.equal(state.profile.name, "Pat QA");
  await act(async () => renderer.update(<Probe subject="another-account" />));
  assert.deepEqual(state.profile, fallback);
  assert.equal(state.accountKind, undefined);
  assert.equal(renderer.root.findByType("div").props["data-name"], "Original");
  await act(async () => renderer.unmount());
});

void test("a persisted character is rendered in account avatars without treating it as an uploaded photo", async () => {
  let state!: IdentityState, renderer!: ReactTestRenderer;
  const value = { ...self, hasAvatar: false, avatar: null, avatarCharacterId: "nora" };
  const http = client(async () => ({ data: value }));
  function Probe() { state = useSelfProfileIdentity(http, "pat", fallback); return null; }
  await act(async () => { renderer = create(<Probe />); });
  assert.equal(state.profile.hasAvatar, true, "the shell can load a character portrait");
  assert.match((await state.avatarLoader(new AbortController().signal))!.url, /\/nora\.webp$/);
  await act(async () => state.updateProfile({ ...value, version: 5 }));
  assert.equal(state.profile.hasAvatar, true);
  await act(async () => renderer.unmount());
});
