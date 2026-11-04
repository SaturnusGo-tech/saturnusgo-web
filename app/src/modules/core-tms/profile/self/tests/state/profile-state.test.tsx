import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useSelfProfile } from "../../application/useSelfProfile";
import { useProfileActivity } from "../../application/useProfileActivity";
import type { SelfProfile, SelfProfileActivity, ProfilePeriod } from "../../domain/profile-model";
import { activity, profile, profilePort } from "../helpers/profile-fixtures";

void test("saving is single flight and a failure leaves the last saved profile available", async () => {
  let state!: ReturnType<typeof useSelfProfile>, renderer!: ReactTestRenderer;
  let resolve!: (value: SelfProfile) => void, saves = 0, fail = false;
  const failure = new Error("Conflict");
  const client = profilePort({ update: async (_profile, details) => {
    saves++; if (fail) throw failure;
    return new Promise(value => { resolve = value; });
  } });
  function Probe() { state = useSelfProfile(client); return null; }
  await act(async () => { renderer = create(<Probe />); });
  const details = { name: "Updated", phone: "", introduction: "", bio: "", location: "", contactUrl: null };
  let saved!: Promise<boolean>;
  await act(async () => { saved = state.save(details); });
  assert.equal(state.pending, true);
  assert.equal(await state.save(details), false);
  assert.equal(saves, 1);
  await act(async () => resolve({ ...profile, ...details, version: 4 }));
  assert.equal(await saved, true);
  assert.equal(state.notice, true);
  assert.equal(state.profile?.name, "Updated");
  fail = true;
  await act(async () => { assert.equal(await state.save({ ...details, name: "Unpersisted" }), false); });
  assert.equal(state.error, failure);
  assert.equal(state.notice, false);
  assert.equal(state.pending, false);
  assert.equal(state.profile?.name, "Updated");
  await act(async () => renderer.unmount());
});

void test("profile load and an in-flight mutation are cancelled when leaving the screen", async () => {
  let state!: ReturnType<typeof useSelfProfile>, renderer!: ReactTestRenderer;
  let readSignal!: AbortSignal, mutationSignal!: AbortSignal;
  const client = profilePort({
    read: async signal => { readSignal = signal; return profile; },
    remove: async (_profile, _kind, signal) => { mutationSignal = signal; return new Promise(() => {}); },
  });
  function Probe() { state = useSelfProfile(client); return null; }
  await act(async () => { renderer = create(<Probe />); });
  await act(async () => { void state.remove("avatar"); });
  await act(async () => renderer.unmount());
  assert.equal(readSignal.aborted, true);
  assert.equal(mutationSignal.aborted, true);
});

void test("saving cancels a retry read so its older response cannot replace the saved version", async () => {
  let state!: ReturnType<typeof useSelfProfile>, renderer!: ReactTestRenderer, reads = 0;
  let resolveRetry!: (value: SelfProfile) => void, retrySignal!: AbortSignal;
  const saved = { ...profile, name: "Confirmed name", version: profile.version + 1 };
  const client = profilePort({
    read: signal => ++reads === 1 ? Promise.resolve(profile) : new Promise(resolve => { retrySignal = signal; resolveRetry = resolve; }),
    update: async () => saved,
  });
  function Probe() { state = useSelfProfile(client); return null; }
  await act(async () => { renderer = create(<Probe />); });
  await act(async () => state.retry());
  await act(async () => { await state.save({ name: saved.name, phone: "", introduction: "", bio: "", location: "", contactUrl: null }); });
  assert.equal(retrySignal.aborted, true);
  await act(async () => resolveRetry(profile));
  assert.equal(state.profile?.name, saved.name);
  assert.equal(state.profile?.version, saved.version);
  assert.equal(state.loading, false);
  await act(async () => renderer.unmount());
});

void test("changing activity period or workspace discards old results and never queries without a workspace", async () => {
  let state!: ReturnType<typeof useProfileActivity>, renderer!: ReactTestRenderer;
  const requests: { workspace: string; days: ProfilePeriod; signal: AbortSignal; resolve: (value: SelfProfileActivity) => void }[] = [];
  const client = profilePort({ activity: (workspace, days, signal) => new Promise(resolve => requests.push({ workspace, days, signal, resolve })) });
  function Probe({ workspace, days }: { workspace: string | null; days: ProfilePeriod }) {
    state = useProfileActivity(client, workspace, days); return null;
  }
  await act(async () => { renderer = create(<Probe workspace={null} days={30} />); });
  assert.equal(requests.length, 0);
  assert.equal(state.loading, false);
  await act(async () => renderer.update(<Probe workspace="one" days={30} />));
  await act(async () => renderer.update(<Probe workspace="one" days={90} />));
  assert.equal(requests[0].signal.aborted, true);
  await act(async () => requests[1].resolve(activity("current-90")));
  await act(async () => requests[0].resolve(activity("stale-30")));
  assert.deepEqual(state.value, activity("current-90"));
  await act(async () => renderer.update(<Probe workspace="two" days={90} />));
  assert.equal(state.value, null, "the old workspace chart is hidden immediately");
  assert.equal(state.loading, true);
  await act(async () => requests[2].resolve(activity("second-workspace")));
  assert.deepEqual(state.value, activity("second-workspace"));
  await act(async () => renderer.unmount());
});
