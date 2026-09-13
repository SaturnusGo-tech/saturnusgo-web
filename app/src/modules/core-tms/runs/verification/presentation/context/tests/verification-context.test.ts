import assert from "node:assert/strict";
import test from "node:test";
import type { RunItem, TestRunSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import { componentHarness, nodes, invoke } from "../../../../../portfolios/tests/support/component-harness";
import { localizedLabel } from "../../../../../localization/format/labels";
import type { VerificationRunContext } from "../VerificationRunContext";
import type { VerificationRunEntry } from "../../../model/verification";
import { entry, run } from "../../../tests/fixtures/verification-fixture";

function fixture() {
  const h = componentHarness(); const opened: [string, string][] = []; const bugs: string[] = [];
  const context = { enabled: true, pending: false, error: false, refresh() {}, items: [
    { ...entry, currentStatus: "ready_for_retest", runItemId: "item-new", readinessChanged: false } as VerificationRunEntry,
  ] };
  const { VerificationRunContext: View } = h.load<{ VerificationRunContext: typeof VerificationRunContext }>(new URL("../VerificationRunContext.tsx", import.meta.url), name => {
    if (name.endsWith("useRunVerificationContext")) return { useRunVerificationContext: () => context };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru" }) };
    if (name.endsWith("format/labels")) return { localizedLabel };
    return undefined;
  });
  const item = { id: "item-new", caseId: "case-1", status: "passed" } as RunItem;
  const render = () => nodes(h.render(() => View({ run: run as TestRunSummary, item, connected: true,
    onOpenCaseActivity: (caseId, defectId) => { opened.push([caseId, defectId]); }, onOpenDefect: id => { bugs.push(id); } })));
  const action = (tree: ReturnType<typeof render>) => tree.find(node => node.type === "button" &&
    (node.props.className === "confirm" || node.props.className === "open"))!;
  return { h, context, item, render, action, opened, bugs };
}

test("passed retest offers confirmation in the exact case history without changing any defect status", () => {
  const f = fixture(); const tree = f.render();
  assert.equal(f.action(tree).props.className, "confirm"); invoke(f.action(tree), "onClick");
  assert.deepEqual(f.opened, [["case-1", "bug-1"]]); assert.deepEqual(f.bugs, []);
  assert.equal(f.context.items[0].currentStatus, "ready_for_retest"); f.h.dispose();
});

test("failed, changed and terminal defects lead to their card instead of confirmation", () => {
  const f = fixture(); f.item.status = "failed";
  assert.equal(f.action(f.render()).props.className, "open");
  f.item.status = "passed"; f.context.items[0].readinessChanged = true;
  assert.equal(f.action(f.render()).props.className, "open");
  f.context.items[0].readinessChanged = false; f.context.items[0].currentStatus = "verified";
  invoke(f.action(f.render()), "onClick"); assert.deepEqual(f.bugs, ["bug-1"]); assert.deepEqual(f.opened, []);
  f.h.dispose();
});

test("the context hides for ordinary runs and disables actions during refresh", () => {
  const f = fixture(); f.context.enabled = false; assert.deepEqual(f.render(), []);
  f.context.enabled = true; f.context.pending = true;
  assert.equal(f.action(f.render()).props.disabled, true); assert.equal(f.action(f.render()).props.className, "open");
  f.h.dispose();
});
