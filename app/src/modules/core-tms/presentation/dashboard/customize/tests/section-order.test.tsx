import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { BoardWidget } from "../../../../dashboards/layout/model/layout";
import { dashboardSections } from "../../../../dashboards/layout/sections/widget-sections";

type GridProps = { widgets: BoardWidget[]; onMove: (id: string, index: number) => void };
function WidgetGrid(props: GridProps) { return <div data-widget-ids={props.widgets.map(widget => widget.id)} />; }
function SectionNavigation({ sections }: { sections: string[] }) { return <nav data-tabs={sections} />; }
const nothing = () => null;
const widget = (id: string, key: string): BoardWidget => ({ id, type: "summary", title: id,
  position: { x: 0, y: 0, width: 6, height: 1 }, settings: { presentation: key } });
const widgets = [widget("triage", "queue"), widget("rate", "passRate"), widget("defects", "defects"),
  widget("trend", "trend"), widget("library", "currentCases"), widget("retest", "readyForRetest")];

function screen(t: TestContext, selected: string, boardWidgets = widgets, workflow = true) {
  const require = createRequire(import.meta.url), cache = new Map<string, NodeModule | undefined>();
  const css = require.extensions[".css"], react = Object.getOwnPropertyDescriptor(globalThis, "React");
  const window = Object.getOwnPropertyDescriptor(globalThis, "window");
  const flag = process.env.NEXT_PUBLIC_TMS_DASHBOARDCN_PREVIEW;
  process.env.NEXT_PUBLIC_TMS_DASHBOARDCN_PREVIEW = workflow ? "1" : "0";
  Object.assign(globalThis, { React });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: () => ({ matches: true }) } });
  require.extensions[".css"] = module => { module.exports = {}; };
  const stub = (path: string, exports: Record<string, unknown>) => {
    const id = require.resolve(path); cache.set(id, require.cache[id]);
    require.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
  };
  stub("../../../common/error/ErrorToast", { ErrorToast: nothing });
  stub("../../../common/select/AnimatedSelect", { AnimatedSelect: nothing });
  stub("../../../workspace/header-actions/WorkspaceHeaderActions", { WorkspaceHeaderActions: nothing });
  stub("../../../../localization/context/useTmsLocale", { useTmsLocale: () => ({ locale: "en", languageTag: "en-US", t: (key: string) => key }) });
  stub("../../workbench/controls/WorkbenchContextBar", { WorkbenchContextBar: nothing });
  stub("../grid/WidgetGrid", { WidgetGrid });
  stub("../render/WidgetRenderer", { WidgetRenderer: nothing });
  stub("../navigation/SectionNavigation", { SectionNavigation });
  stub("../tools/DashboardBoardTools", { DashboardBoardTools: nothing });
  stub("framer-motion", { useReducedMotion: () => true, AnimatePresence: nothing, motion: { div: nothing } });
  const id = require.resolve("../DashboardContent"); cache.set(id, require.cache[id]); delete require.cache[id];
  const { DashboardContent } = require("../DashboardContent") as typeof import("../DashboardContent");
  const moves: [string, number][] = [];
  const props = { layout: { board: { widgets: boardWidgets }, controller: {
    move: (id: string, index: number) => moves.push([id, index]), remove: nothing, resize: nothing,
  } }, model: { snapshot: null, analytics: {}, workbench: {}, preferences: {
    value: { section: selected, period: "30d", filtersOpen: false }, stored: true, update: nothing,
  } }, data: { meta: { authorization: { capabilities: [] } } }, projectName: "QA" } as unknown as Parameters<typeof DashboardContent>[0];
  let view!: ReactTestRenderer; act(() => { view = create(<DashboardContent {...props} />); });
  t.after(() => {
    act(() => view.unmount());
    for (const [id, previous] of cache) { if (previous) require.cache[id] = previous; else delete require.cache[id]; }
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    if (react) Object.defineProperty(globalThis, "React", react); else Reflect.deleteProperty(globalThis, "React");
    if (window) Object.defineProperty(globalThis, "window", window); else Reflect.deleteProperty(globalThis, "window");
    if (flag === undefined) delete process.env.NEXT_PUBLIC_TMS_DASHBOARDCN_PREVIEW;
    else process.env.NEXT_PUBLIC_TMS_DASHBOARDCN_PREVIEW = flag;
  });
  return { view, moves, sections: () => view.root.findAllByType("section") };
}

for (const workflow of [true, false]) test(`All sections renders Runs & risks, Defects, Test library, then Triage (workflow=${workflow})`, t => {
  const page = screen(t, "all", widgets, workflow);
  assert.deepEqual(page.sections().map(section => section.props["data-dashboard-section"]), ["runs", "defects", "library", "overview"]);
  assert.ok(page.sections().every(section => !section.props.hidden));
});

test("All sections preserves navigation, saved widget order within each section and move indexes", t => {
  const saved = widgets.map(item => item.id), page = screen(t, "all");
  assert.deepEqual(page.view.root.findByType("nav").props["data-tabs"], dashboardSections);
  const runs = page.sections().find(section => section.props["data-dashboard-section"] === "runs")!;
  const grid = runs.findByType(WidgetGrid);
  assert.deepEqual(grid.props.widgets.map((item: BoardWidget) => item.id), ["rate", "trend"]);
  grid.props.onMove("rate", 1); assert.deepEqual(page.moves, [["rate", 3]]);
  assert.deepEqual(widgets.map(item => item.id), saved);
  assert.deepEqual(dashboardSections, ["overview", "runs", "defects", "library"]);
});

test("selecting a single section keeps its existing mounted order and only reveals that section", t => {
  const page = screen(t, "defects");
  assert.deepEqual(page.sections().map(section => section.props["data-dashboard-section"]), dashboardSections);
  assert.deepEqual(page.sections().filter(section => !section.props.hidden).map(section => section.props["data-dashboard-section"]), ["defects"]);
});

test("All sections omits absent groups without adding empty sections", t => {
  const partial = screen(t, "all", [widgets[0], widgets[4]]);
  assert.deepEqual(partial.sections().map(section => section.props["data-dashboard-section"]), ["library", "overview"]);
});

test("a board with one section keeps its automatic selection", t => {
  const single = screen(t, "all", [widgets[3], widgets[1]]);
  assert.deepEqual(single.sections().map(section => section.props["data-dashboard-section"]), ["runs"]);
  assert.equal(single.sections()[0].props.hidden, false);
});
