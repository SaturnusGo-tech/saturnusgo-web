import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import ts from "typescript";
import type { DashboardReadiness, useDashboardWidgetPending } from "../DashboardReadiness";

function fixture({ basePending = false, widgetPending = false, showWidget = true, secondWidgetPending = undefined as boolean | undefined } = {}) {
  let now = 0, nextId = 0;
  const timers = new Map<number, { time: number; callback: () => void }>();
  const module = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL("../DashboardReadiness.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports,
    setTimeout: (callback: () => void, delay: number) => { const id = ++nextId; timers.set(id, { time: now + delay, callback }); return id; },
    clearTimeout: (id: number) => timers.delete(id),
    require: (name: string) => name === "react" ? React : jsxRuntime,
  });
  const { DashboardReadiness: Boundary, useDashboardWidgetPending: usePending } = module.exports as {
    DashboardReadiness: typeof DashboardReadiness; useDashboardWidgetPending: typeof useDashboardWidgetPending;
  };
  let view: ReactTestRenderer;
  function Widget({ pending }: { pending: boolean }) { usePending(pending); return <span data-widget />; }
  function App() {
    return <Boundary pending={basePending}>{covered => <main data-covered={covered}>
      {showWidget && <Widget pending={widgetPending} />}
      {secondWidgetPending !== undefined && <Widget pending={secondWidgetPending} />}
    </main>}</Boundary>;
  }
  const render = () => act(() => { if (view) view.update(<App />); else view = create(<App />); });
  render();
  const advance = (ms: number) => act(() => {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, timer]) => timer.time <= end).sort((a, b) => a[1].time - b[1].time)[0];
      if (!next) break;
      now = next[1].time; timers.delete(next[0]); next[1].callback();
    }
    now = end;
  });
  return { advance, covered: () => view!.root.findByType("main").props["data-covered"],
    update: (patch: { basePending?: boolean; widgetPending?: boolean; showWidget?: boolean; secondWidgetPending?: boolean }) => {
      basePending = patch.basePending ?? basePending; widgetPending = patch.widgetPending ?? widgetPending;
      showWidget = patch.showWidget ?? showWidget; secondWidgetPending = patch.secondWidgetPending ?? secondWidgetPending; render();
    }, pendingTimers: () => timers.size, dispose: () => act(() => view!.unmount()),
    mountWithoutProvider: () => act(() => { view = create(<Widget pending />); }),
  };
}

test("child-first pending registration holds the initial reveal until the widget settles and one quiet frame passes", () => {
  const f = fixture({ widgetPending: true });
  assert.equal(f.covered(), true); f.advance(100); assert.equal(f.covered(), true);
  f.update({ widgetPending: false }); f.advance(31); assert.equal(f.covered(), true);
  f.advance(1); assert.equal(f.covered(), false); f.dispose();
});

test("base reads keep a ready child covered; terminal failure settling releases the boundary", () => {
  const f = fixture({ basePending: true, widgetPending: true });
  f.update({ widgetPending: false }); f.advance(100); assert.equal(f.covered(), true);
  f.update({ basePending: false }); f.advance(32); assert.equal(f.covered(), false); f.dispose();
});

test("a widget starting during the quiet window cancels early reveal", () => {
  const f = fixture(); f.advance(20);
  f.update({ widgetPending: true }); f.advance(100); assert.equal(f.covered(), true);
  f.update({ widgetPending: false }); f.advance(32); assert.equal(f.covered(), false); f.dispose();
});

test("independent widget registrations all settle before reveal", () => {
  const f = fixture({ widgetPending: true, secondWidgetPending: true });
  f.update({ widgetPending: false }); f.advance(100); assert.equal(f.covered(), true);
  f.update({ secondWidgetPending: false }); f.advance(32); assert.equal(f.covered(), false); f.dispose();
});

test("unrelated rerenders preserve stable registration and do not restart the quiet window", () => {
  const f = fixture(); f.advance(20); f.update({ widgetPending: false });
  f.advance(12); assert.equal(f.covered(), false); f.dispose();
});

test("sealed readiness never reblocks background refresh or newly mounted widgets", () => {
  const f = fixture(); f.advance(32); assert.equal(f.covered(), false);
  f.update({ basePending: true, widgetPending: true }); f.advance(100);
  assert.equal(f.covered(), false); assert.equal(f.pendingTimers(), 0); f.dispose();
});

test("unmounted pending widgets release their registration, and provider unmount cancels timers", () => {
  const f = fixture({ widgetPending: true });
  f.update({ showWidget: false }); f.advance(32); assert.equal(f.covered(), false); f.dispose();
  const pending = fixture(); assert.equal(pending.pendingTimers(), 1);
  pending.dispose(); assert.equal(pending.pendingTimers(), 0); pending.advance(100);
});

test("widget feedback outside a dashboard provider is a no-op", () => {
  const f = fixture(); f.dispose();
  assert.doesNotThrow(() => f.mountWithoutProvider()); f.dispose();
});
