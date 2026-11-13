import assert from "node:assert/strict";
import test from "node:test";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { localizedLabel } from "../../../../localization/format/labels";
import type { DefectReportHeader } from "../../detail/header/DefectReportHeader";
import type { DefectRetest } from "../../../../runs/verification/state/defect/useDefectRetest";
import { buildDefectDeepLink } from "../../../../defects/navigation/defect-deep-link";

const defect = { id: "private-defect-id", projectId: "project", key: "GUIDE-BUG-2", title: "Balance stays unchanged",
  status: "verified", createdAt: "2026-11-13T09:00:00Z", archivedAt: null } as Defect;

function setup(locale: "ru" | "en", input = defect, reducedMotion = false) {
  const h = componentHarness();
  const { DefectReportHeader: View } = h.load<{ DefectReportHeader: typeof DefectReportHeader }>(
    new URL("../../detail/header/DefectReportHeader.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale, t: (key: string) => key }) };
      if (name.endsWith("labels")) return { localizedLabel };
      if (name.endsWith("defect-deep-link")) return { buildDefectDeepLink };
      if (name === "framer-motion") return { useReducedMotion: () => reducedMotion };
      return undefined;
    });
  let selected = ""; let closed = false;
  const retest = { enabled: true, canStart: false } as DefectRetest;
  const tree = nodes(h.render(() => View({ defect: input, workspaceId: "workspace", retest, evidenceCount: 2,
    tabsId: "report", tab: "overview", onTabChange: tab => { selected = tab; }, onBack: () => { closed = true; } })));
  return { h, tree, retest, selected: () => selected, closed: () => closed };
}

test("resource key and actual localized status appear above the title in both languages", () => {
  for (const locale of ["en", "ru"] as const) {
    for (const status of ["open", "ready_for_retest", "verified", "reopened", "closed"]) {
      const current = { ...defect, status } as Defect; const f = setup(locale, current);
      const key = f.tree.findIndex(node => node.props.children === defect.key);
      const title = f.tree.findIndex(node => node.type === "h2");
      const statusLabel = f.tree.findIndex(node => node.props.children === localizedLabel(locale, status));
      assert.ok(key >= 0 && key < title, "resource key precedes heading");
      assert.ok(statusLabel >= 0 && statusLabel < title, "localized actual status precedes heading");
      assert.equal(f.tree.find(node => node.type === "DefectStatusIcon")?.props.status, status);
      assert.equal(f.tree[title].props.children, defect.title);
      assert.ok(!f.tree.some(node => node.props.children === defect.id));
      f.h.dispose();
    }
  }
});

test("header retains retest permissions, sharing, close, dates and accessible attachment tabs", () => {
  const f = setup("en");
  assert.equal(f.tree.find(node => node.type === "DefectRetestAction")?.props.retest, f.retest);
  assert.equal(f.tree.find(node => node.type === "DefectRetestPanel")?.props.retest, f.retest);
  assert.equal(f.tree.find(node => node.type === "CommentShareItem")?.props.resource, "defect");
  const dates = f.tree.find(node => node.type === "DefectReportDates" || (node.type as unknown as { name: string }).name === "DefectReportDates");
  assert.equal(dates?.props.createdAt, defect.createdAt);
  assert.equal(dates?.props.archivedAt, defect.archivedAt);
  const tabs = f.tree.find(node => node.type === "Tabs")!;
  invoke(tabs, "onSelectionChange", "attachments"); assert.equal(f.selected(), "attachments");
  invoke(tabs, "onSelectionChange", "unsupported"); assert.equal(f.selected(), "attachments");
  assert.equal(f.tree.find(node => node.props.id === "report-attachments")?.props["aria-controls"], "report-panel");
  assert.ok(nodes(f.tree.find(node => node.props.id === "report-attachments")?.props.title).some(node => node.props.children === 2));
  invoke(f.tree.find(node => node.props["aria-label"] === "reports.backToList")!, "onPress");
  assert.equal(f.closed(), true); f.h.dispose();
});

test("date disclosure retains created/archive timestamps and touch toggling in both languages", () => {
  for (const locale of ["en", "ru"] as const) {
    const h = componentHarness();
    const { DefectReportDates: Dates } = h.load<{ DefectReportDates: (props: { createdAt: string; archivedAt: string }) => unknown }>(
      new URL("../../detail/header/dates/DefectReportDates.tsx", import.meta.url), name => name.endsWith("useTmsLocale") ? {
        useTmsLocale: () => ({ locale, languageTag: locale === "ru" ? "ru-RU" : "en-US", t: (key: string) => key }),
      } : undefined);
    const input = { createdAt: defect.createdAt, archivedAt: "2026-11-13T10:00:00Z" };
    const render = () => nodes(h.render(() => Dates(input)));
    const initial = render(); const disclosure = initial.find(node => node.type === "Tooltip")!;
    assert.deepEqual(nodes(disclosure.props.content).filter(node => node.type === "time").map(node => node.props.dateTime),
      [input.createdAt, input.archivedAt]);
    assert.equal(disclosure.props.isOpen, false);
    const trigger = initial.find(node => node.type === "Button")!;
    assert.equal(trigger.props["aria-label"], locale === "ru" ? "Даты баг-репорта" : "Bug report dates");
    invoke(trigger, "onPointerDownCapture", { pointerType: "touch" }); invoke(trigger, "onPress", { pointerType: "touch" });
    assert.equal(render().find(node => node.type === "Tooltip")?.props.isOpen, true);
    const next = render().find(node => node.type === "Button")!;
    invoke(next, "onPointerDownCapture", { pointerType: "touch" }); invoke(next, "onPress", { pointerType: "touch" });
    assert.equal(render().find(node => node.type === "Tooltip")?.props.isOpen, false); h.dispose();
  }
});

test("header tabs respect reduced motion", () => {
  const f = setup("en", defect, true);
  assert.equal(f.tree.find(node => node.type === "Tabs")?.props.disableAnimation, true);
  f.h.dispose();
});

test("copying a report preserves its company, project and archived-resource scope", () => {
  for (const archivedAt of [null, "2026-11-13T10:00:00Z"]) {
    const f = setup("en", { ...defect, archivedAt });
    f.h.navigate("https://company.falcon.example/work/?workspaceId=stale&view=cases&projectId=other&caseId=case-1#old");
    const share = f.tree.find(node => node.type === "CommentShareItem")!;
    const actual = (share.props.link as () => string)();
    assert.equal(actual, "https://company.falcon.example/work/?workspaceId=workspace&projectId=project&view=reports&defectId=private-defect-id" + (archivedAt ? "&archivedDefect=true" : ""));
    f.h.dispose();
  }
});
