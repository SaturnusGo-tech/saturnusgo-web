import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { ReportsView } from "../../ReportsView";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import type { useNavigationValue } from "../../../../state/navigation/context/useNavigationValue";

function fixture() {
  const h = componentHarness();
  const saved = new Map<string, unknown>();
  const navigation = h.load<{ useNavigationValue: typeof useNavigationValue }>(new URL(
    "../../../../state/navigation/context/useNavigationValue.ts", import.meta.url), name => name.endsWith("workspace-history") ? {
      readNavigationContext: (key: string, initial: unknown) => saved.get(key) ?? initial,
      saveNavigationContext: (key: string, value: unknown) => saved.set(key, value),
    } : undefined);
  const { ReportsView: View } = h.load<{ ReportsView: typeof ReportsView }>(new URL("../../ReportsView.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("useNavigationValue")) return navigation;
    if (name.endsWith("useDefectCommentTab")) return { useDefectCommentTab() {} };
    if (name === "framer-motion") return { motion: { div: "motion.div", aside: "motion.aside" }, AnimatePresence: "AnimatePresence", useReducedMotion: () => true };
    return undefined;
  });
  let selected: string | null = "bug-one";
  let creating = false;
  const events: (string | null)[] = [];
  const render = (patch: Partial<Parameters<typeof View>[0]> = {}) => nodes(h.render(() => View({ workspaceId: "workspace", projectId: "project", projectName: "Payments",
    defects: [{ id: "bug-one", status: "open" } as Defect], runs: [], links: [], selectedDefectId: selected,
    onSelectDefect: id => { selected = id; events.push(id); }, selectedDefectStatus: "ready", onRetrySelectedDefect() {},
    onNew: () => { events.push("create"); creating = true; }, onOpenRun() {}, creating, ...patch })));
  return { h, saved, render, events, selected: () => selected, creating: () => creating, closeCreation: () => { creating = false; } };
}

test("new bug clears the displayed defect before opening creation", t => {
  const f = fixture(); t.after(() => f.h.dispose());
  assert.ok(f.render().some(node => node.type === "DefectReportDetail"));
  invoke(f.render().find(node => node.type === "DefectBrowser")!, "onNew");
  assert.deepEqual(f.events, [null, "create"]);
  assert.equal(f.selected(), null);
  assert.equal(f.creating(), true);
  assert.ok(!f.render().some(node => node.type === "DefectReportDetail" || node.type === "motion.aside"));
});

test("creation clears the detail tab and reopening a bug keeps its close action usable", t => {
  const f = fixture(); t.after(() => f.h.dispose());
  invoke(f.render().find(node => node.type === "DefectReportDetail")!, "onTabChange", "attachments");
  assert.equal(f.render().find(node => node.type === "DefectReportDetail")?.props.tab, "attachments");
  invoke(f.render().find(node => node.type === "DefectBrowser")!, "onNew");
  assert.equal(f.saved.get("reports:workspace:project:tab"), "overview");
  f.closeCreation();
  invoke(f.render().find(node => node.type === "DefectBrowser")!, "onSelectDefect", "bug-one");
  const detail = f.render().find(node => node.type === "DefectReportDetail");
  assert.ok(detail);
  assert.equal(detail.props.tab, "overview");
  invoke(detail, "onBack");
  assert.equal(f.selected(), null);
  assert.ok(!f.render().some(node => node.type === "DefectReportDetail"));
});

test("new bug without a selected detail opens creation without inventing a selection", t => {
  const f = fixture(); t.after(() => f.h.dispose());
  invoke(f.render().find(node => node.type === "DefectReportDetail")!, "onBack");
  f.events.length = 0;
  invoke(f.render().find(node => node.type === "DefectBrowser")!, "onNew");
  assert.equal(f.selected(), null);
  assert.equal(f.creating(), true);
  assert.equal(f.events[f.events.length - 1], "create");
});


test("creation removes the previous detail exit surface even when navigation still has a selected bug", t => {
  const f = fixture(); t.after(() => f.h.dispose());
  assert.ok(f.render().some(node => node.type === "AnimatePresence"));
  for (const selectedDefectStatus of ["ready", "loading", "error"] as const) {
    const tree = f.render({ creating: true, selectedDefectStatus });
    assert.equal(f.selected(), "bug-one");
    assert.equal(tree[0].props["data-detail-open"], undefined);
    assert.ok(!tree.some(node => ["AnimatePresence", "motion.aside", "DefectReportDetail", "TessiqLoader", "ErrorToast"].includes(node.type)));
  }
});
