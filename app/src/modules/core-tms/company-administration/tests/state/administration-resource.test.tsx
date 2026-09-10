import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";

let current: ReturnType<typeof useAdministrationResource<string>>;
function Probe({ load }: { load: (signal: AbortSignal) => Promise<string> }) { current = useAdministrationResource(load); return null; }

void test("refresh preserves rendered company data and switching companies discards it immediately", async () => {
  const pending: { resolve: (value: string) => void; signal: AbortSignal }[] = [];
  const load = (signal: AbortSignal) => new Promise<string>((resolve) => pending.push({ resolve, signal }));
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe load={load} />); });
  assert.equal(current.loading, true);
  await act(async () => pending[0].resolve("Alpha"));
  await act(async () => current.refresh());
  assert.equal(current.loading, false); assert.equal(current.refreshing, true); assert.equal(current.value, "Alpha");
  const next = (signal: AbortSignal) => new Promise<string>((resolve) => pending.push({ resolve, signal }));
  await act(async () => renderer.update(<Probe load={next} />));
  assert.equal(current.value, null); assert.equal(current.loading, true); assert.equal(pending[1].signal.aborted, true);
  await act(async () => pending[1].resolve("Stale Alpha")); assert.equal(current.value, null);
  await act(async () => pending[2].resolve("Bravo")); assert.equal(current.value, "Bravo");
  await act(async () => renderer.unmount());
});

void test("refresh failure preserves readable content, but a revoked permission immediately discards it", async () => {
  const { AdministrationError } = await import("../../domain/administration");
  let failure: string | null = null;
  const load = async () => { if (failure) throw new AdministrationError(failure); return "Private company"; };
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe load={load} />); });
  failure = "SERVICE_UNAVAILABLE";
  await act(async () => current.refresh());
  assert.equal(current.value, "Private company"); assert.equal(current.error, failure);
  failure = "ACCESS_DENIED";
  await act(async () => current.refresh());
  assert.equal(current.value, null); assert.equal(current.error, failure);
  await act(async () => renderer.unmount());
});
