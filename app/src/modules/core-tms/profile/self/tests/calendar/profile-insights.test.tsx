import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useProfileInsights } from "../../application/insights/useProfileInsights";
import { profilePort, activity } from "../helpers/profile-fixtures";
import type { SelfProfileActivity } from "../../domain/profile-model";

void test("profile insights discard old tenants and ignore late responses after a year change", async () => {
  const calls: { workspace: string; signal: AbortSignal; resolve: (v: SelfProfileActivity) => void }[] = [];
  const client = profilePort({ calendar: (workspace, _year, signal) => new Promise(resolve => calls.push({ workspace, signal, resolve })) });
  let state!: ReturnType<typeof useProfileInsights>, renderer!: ReactTestRenderer;
  function Probe({ workspace, year }: { workspace: string | null; year: number }) { state = useProfileInsights(client, workspace, year); return null; }
  await act(async () => { renderer = create(<Probe workspace={null} year={2026} />); });
  assert.equal(calls.length, 0);
  await act(async () => renderer.update(<Probe workspace="a" year={2026} />));
  await act(async () => renderer.update(<Probe workspace="b" year={2025} />));
  assert.equal(calls[0].signal.aborted, true);
  assert.equal(state.calendar.value, null);
  await act(async () => calls[1].resolve(activity("current")));
  await act(async () => calls[0].resolve(activity("stale")));
  assert.deepEqual(state.calendar.value, activity("current"));
  await act(async () => renderer.unmount());
});

void test("changing only calendar year preserves achievement progress without refetching the collection", async () => {
  let achievementReads = 0, state!: ReturnType<typeof useProfileInsights>, renderer!: ReactTestRenderer;
  const client = profilePort({ achievements: async () => { achievementReads++; return { catalogVersion: 1, items: [] }; } });
  function Probe({ year }: { year: number }) { state = useProfileInsights(client, "workspace", year); return null; }
  await act(async () => { renderer = create(<Probe year={2026} />); });
  const value = state.achievements.value;
  await act(async () => renderer.update(<Probe year={2025} />));
  assert.equal(achievementReads, 1);
  assert.equal(state.achievements.value, value);
  assert.equal(state.achievements.loading, false);
  await act(async () => renderer.unmount());
});
