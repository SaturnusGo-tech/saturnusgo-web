import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import type { DataManifest, ExecutionScope } from "../../../model/execution/manifest";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url);
test("changing execution or actor hides the previous manifest before effects and rejects late replies", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const restore = installRenderControls();
  let Panel: typeof import("../../../presentation/execution/ExecutionDataPanel")["ExecutionDataPanel"];
  try { Panel = require("../../../presentation/execution/ExecutionDataPanel").ExecutionDataPanel; } finally { restore(); }
  const requests: { scope: ExecutionScope; signal: AbortSignal; resolve(value: DataManifest): void }[] = [];
  const feature = (actorId: string) => ({ actorId, projectId: "p", permissions: {}, port: {
    manifest: (scope: ExecutionScope, signal: AbortSignal) => new Promise<DataManifest>(resolve => requests.push({ scope, signal, resolve })),
  } }) as unknown as TestDataContextValue;
  const manifest = (name: string): DataManifest => ({ executionId: name, environmentId: null, preparedAt: "2026-11-14T00:00:00Z", sources: [{ alias: name, name, sourceType: "STATIC", fields: [] }] });
  const observed: string[] = [];
  let view: ReturnType<typeof create> | undefined;
  let actor = feature("qa-a"), scope = { runId: "run-a", itemId: "item-a", attemptNo: 1 };
  const render = () => <TestDataProvider value={actor}><React.Profiler id="execution" onRender={() => {
    if (view) observed.push(JSON.stringify(view.toJSON()));
  }}><Panel scope={scope} refreshVersion="1" configured ru={false} /></React.Profiler></TestDataProvider>;
  try {
    await act(async () => { view = create(render()); });
    await act(async () => { requests[0].resolve(manifest("old-manifest")); });
    assert.ok(JSON.stringify(view!.toJSON()).includes("old-manifest"));
    observed.length = 0; scope = { runId: "run-a", itemId: "item-b", attemptNo: 2 };
    await act(async () => { view!.update(render()); });
    assert.ok(observed.length > 0); assert.ok(observed.every(text => !text.includes("old-manifest")), "the first commit must belong to the newly selected attempt");
    const old = requests[1]; scope = { runId: "run-b", itemId: "item-c", attemptNo: 1 };
    await act(async () => { view!.update(render()); });
    assert.equal(old.signal.aborted, true);
    await act(async () => { old.resolve(manifest("late-manifest")); });
    assert.equal(JSON.stringify(view!.toJSON()).includes("late-manifest"), false);
    await act(async () => { requests[2].resolve(manifest("current-manifest")); });
    assert.ok(JSON.stringify(view!.toJSON()).includes("current-manifest"));
    observed.length = 0; actor = feature("qa-b");
    await act(async () => { view!.update(render()); });
    assert.ok(observed.every(text => !text.includes("current-manifest")), "new actor permissions cannot briefly inherit another actor's manifest");
  } finally {
    await act(async () => view?.unmount());
    if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React");
  }
});
