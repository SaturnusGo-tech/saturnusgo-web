import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useAdministrationList } from "../../application/list/useAdministrationList";
import { AdministrationError, type ResultPage } from "../../domain/administration";

let current: ReturnType<typeof useAdministrationList<string>>;
type Load = (search: string, cursor: string | null, signal: AbortSignal) => Promise<ResultPage<string>>;
function Probe({ load }: { load: Load }) { current = useAdministrationList(load); return null; }
const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });

void test("refresh retains the directory, a changed company discards it and ignores the stale response", async () => {
  const pending: { resolve: (value: ResultPage<string>) => void; signal: AbortSignal }[] = [];
  const load: Load = (_, __, signal) => new Promise((resolve) => pending.push({ resolve, signal }));
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe load={load} />); }); await settle();
  await act(async () => pending[0].resolve({ items: ["Anna"], nextCursor: null }));
  await act(async () => current.refresh()); await settle();
  assert.deepEqual(current.items, ["Anna"]); assert.equal(current.loading, false); assert.equal(current.pending, true);
  const another: Load = (_, __, signal) => new Promise((resolve) => pending.push({ resolve, signal }));
  await act(async () => renderer.update(<Probe load={another} />)); await settle();
  assert.deepEqual(current.items, []); assert.equal(current.loading, true); assert.equal(pending[1].signal.aborted, true);
  await act(async () => pending[1].resolve({ items: ["Stale Anna"], nextCursor: null }));
  assert.deepEqual(current.items, []);
  await act(async () => pending[2].resolve({ items: ["Boris"], nextCursor: null }));
  assert.deepEqual(current.items, ["Boris"]);
  await act(async () => renderer.unmount());
});

void test("a revoked permission clears a previously rendered employee directory", async () => {
  let denied = false;
  const load: Load = async () => { if (denied) throw new AdministrationError("ACCESS_DENIED"); return { items: ["Anna"], nextCursor: "next" }; };
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe load={load} />); }); await settle();
  assert.deepEqual(current.items, ["Anna"]); denied = true;
  await act(async () => current.refresh()); await settle();
  assert.deepEqual(current.items, []); assert.equal(current.cursor, null); assert.equal(current.pending, false);
  assert.equal(current.error, "ACCESS_DENIED");
  await act(async () => renderer.unmount());
});
