import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { Defect, TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RunItem } from "../../../../../../core/tms/contracts/execution-contract";
import type { DefectExecutionContext } from "../../detail/context/DefectExecutionContext";

test("execution provenance opens the original immutable run item and never prints storage IDs", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { DefectExecutionContext: View } = h.load<{ DefectExecutionContext: typeof DefectExecutionContext }>(
    new URL("../../detail/context/DefectExecutionContext.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru", t: (key: string) => key }) };
      if (name.endsWith("resolveDefectExecutionStep")) return { resolveDefectExecutionStep: () => ({ order: 1, text: "Подтвердить перевод", kind: "step" }) };
      return undefined;
    });
  const defect = { runId: "original-run-uuid", runItemId: "item-uuid", stepId: "step-uuid" } as Defect;
  const run = { id: defect.runId, key: "GUIDE-TR-3", name: "YouTrack integration demo", build: "2.8.0-rc.1",
    environment: { name: "Source sandbox" } } as TestRunSummary;
  const item = { id: defect.runItemId, snapshot: { title: "Перевод $100" } } as RunItem;
  const opened: unknown[][] = [];
  const tree = nodes(h.render(() => View({ defect, context: { run, item, pending: false, error: false },
    onOpenRun: (...args) => opened.push(args) })));
  const strings = tree.flatMap(node => typeof node.props.children === "string" ? [node.props.children] : []);
  assert.ok(strings.includes("Перевод $100"));
  assert.ok(strings.includes("Source sandbox"));
  assert.ok(strings.includes("2.8.0-rc.1"));
  assert.ok(!strings.some(value => /uuid/.test(value)));
  assert.equal(tree.find(node => node.props["data-failed-step"])?.type, "div");
  const source = tree.find(node => node.type === "button" && node.props["data-source-run"]);
  assert.ok(source); invoke(source, "onClick");
  assert.deepEqual(opened, [[defect.runId, defect.runItemId]]);
});

test("unavailable provenance remains truthful without substituting current case data", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { DefectExecutionContext: View } = h.load<{ DefectExecutionContext: typeof DefectExecutionContext }>(
    new URL("../../detail/context/DefectExecutionContext.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
      if (name.endsWith("resolveDefectExecutionStep")) return { resolveDefectExecutionStep: () => null };
      return undefined;
    });
  const tree = nodes(h.render(() => View({ defect: { runId: "hidden-run", runItemId: "hidden-item", stepId: "hidden-step" } as Defect,
    context: { pending: false, error: true }, onOpenRun() {} })));
  assert.ok(tree.some(node => node.props.role === "status"));
  assert.ok(!tree.some(node => typeof node.props.children === "string" && /hidden-/.test(node.props.children)));
});
