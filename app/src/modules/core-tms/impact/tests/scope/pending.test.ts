import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes, type Node } from "../../../portfolios/tests/support/component-harness";
import type { ScopeReview } from "../../presentation/scope/ScopeReview";
import { analysis, scope } from "../fixtures/impact-fixture";

test("scope writes retain Add test and only mark the clicked row as saving", async () => {
  const harness = componentHarness(); const calls: unknown[] = []; let complete!: () => void;
  const { ScopeReview: Review } = harness.load<{ ScopeReview: typeof ScopeReview }>(
    new URL("../../presentation/scope/ScopeReview.tsx", import.meta.url));
  const props: Parameters<typeof Review>[0] = { analysis: analysis({ scope: [
    { testCaseId: "first", title: "First test", included: true, origin: "falcon" },
    { testCaseId: "second", title: "Second test", included: true, origin: "manual" },
  ] }), scope, ru: false, writable: true, pending: false,
    command: async command => { calls.push(command); await new Promise<void>(resolve => { complete = resolve; }); } };
  const render = () => nodes(harness.render(() => Review(props)));
  let all = render();
  const addButton = () => all.find(node => node.type === "IntegrationButton" && node.props.children === "Add test");
  const rows = () => {
    const collection = all.find(node => node.type === "ReviewCollection" && node.props.label === "Scope tests")!;
    return props.analysis.scope.map(collection.props.children as (item: unknown) => Node);
  };
  invoke(rows()[0], "onToggle"); all = render();
  assert.ok(addButton());
  assert.equal(rows()[0].props.editable, true); assert.equal(rows()[0].props.saving, true);
  assert.equal(rows()[1].props.editable, true); assert.equal(rows()[1].props.saving, false);
  assert.equal(rows()[1].props.pending, true); invoke(rows()[1], "onToggle");
  assert.equal(calls.length, 1); assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), { action: "scope", body: { caseIds: ["second"] } });
  props.pending = true; all = render(); assert.ok(addButton());
  invoke(addButton()!, "onPress"); all = render();
  assert.equal(all.find(node => node.type === "CasePicker")!.props.disabled, true);
  complete(); await new Promise<void>(resolve => setImmediate(resolve));
  props.pending = false; all = render();
  assert.equal(rows().some(row => row.props.saving), false);
  assert.deepEqual(props.analysis.scope.map(item => item.included), [true, true]);
  harness.dispose();
});
