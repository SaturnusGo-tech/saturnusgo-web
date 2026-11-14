import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import type { DataPreflight } from "../../../model/execution/manifest";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url);
test("readiness never flashes a previous item's approval after selection or permission changes", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const restore = installRenderControls();
  let Readiness: typeof import("../../../presentation/execution/DataReadiness")["DataReadiness"];
  try { Readiness = require("../../../presentation/execution/DataReadiness").DataReadiness; } finally { restore(); }
  const requests: { signal: AbortSignal; resolve(value: DataPreflight): void }[] = [];
  const feature = (actorId: string) => ({ actorId, projectId: "p", port: {
    preflight: (_runId: string, _after: number | null, signal: AbortSignal) => new Promise<DataPreflight>(resolve => requests.push({ signal, resolve })),
  } }) as unknown as TestDataContextValue;
  const response = (itemId: string): DataPreflight => ({ valid: true, nextAfter: null, items: [{ itemId, valid: true, errors: [], warnings: [] }] });
  const observed: string[] = [];
  let view: ReturnType<typeof create> | undefined, actor = feature("qa-a"), itemId = "item-a";
  const render = () => <TestDataProvider value={actor}><React.Profiler id="preflight" onRender={() => {
    if (view) observed.push(JSON.stringify(view.toJSON()));
  }}><Readiness runId="run" itemId={itemId} refreshVersion="1" ru={false} /></React.Profiler></TestDataProvider>;
  try {
    await act(async () => { view = create(render()); });
    await act(async () => { requests[0].resolve(response(itemId)); });
    assert.ok(JSON.stringify(view!.toJSON()).includes("Data is ready"));
    observed.length = 0; itemId = "item-b";
    await act(async () => { view!.update(render()); });
    assert.ok(observed.length > 0); assert.ok(observed.every(text => !text.includes("Data is ready")), "new selection must not inherit readiness even before effects");
    const old = requests[1]; actor = feature("qa-b");
    await act(async () => { view!.update(render()); });
    assert.equal(old.signal.aborted, true);
    await act(async () => { old.resolve(response(itemId)); });
    assert.equal(JSON.stringify(view!.toJSON()).includes("Data is ready"), false);
  } finally {
    await act(async () => view?.unmount());
    if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React");
  }
});
