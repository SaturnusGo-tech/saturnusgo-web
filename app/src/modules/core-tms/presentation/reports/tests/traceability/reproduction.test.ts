import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { DefectReproduction } from "../../detail/context/reproduction/DefectReproduction";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";

const reproduction: NonNullable<Defect["reproduction"]> = { origin: "run", caseId: "case", caseRevision: 2,
  steps: [{ id: "failed", order: 1, action: "**Original transfer**", expectedResult: "Paid", testData: "Account 7", required: true,
    sharedStep: { id: "shared", title: "Original shared transfer", revision: 4 }, failed: true }] };

test("compact disclosure renders captured shared identity, instructions and failure only after opening", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { DefectReproduction: View } = h.load<{ DefectReproduction: typeof DefectReproduction }>(new URL("../../detail/context/reproduction/DefectReproduction.tsx", import.meta.url));
  const render = () => nodes(h.render(() => View({ reproduction, ru: false })));
  assert.equal(render().find(node => node.type === "Button")?.props["aria-expanded"], false);
  assert.ok(!render().some(node => node.type === "ScenarioMarkdown"));
  invoke(render().find(node => node.type === "Button")!, "onPress");
  const tree = render();
  assert.equal(tree.find(node => node.type === "Button")?.props["aria-expanded"], true);
  assert.ok(tree.some(node => node.props.children === "Original shared transfer"));
  assert.deepEqual(tree.filter(node => node.type === "ScenarioMarkdown").map(node => node.props.value), ["**Original transfer**", "Paid", "Account 7"]);
  assert.equal(tree.filter(node => node.props["data-failed"] === true).length, 1);
  assert.ok(!tree.some(node => typeof node.props.children === "string" && node.props.children === "shared"));
});

test("manual instructions carry no executed or failed claims and missing historical capture is absent", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { DefectReproduction: View } = h.load<{ DefectReproduction: typeof DefectReproduction }>(new URL("../../detail/context/reproduction/DefectReproduction.tsx", import.meta.url));
  const manual = { ...reproduction, origin: "shared_steps" as const, caseId: null, caseRevision: null,
    steps: reproduction.steps.map(step => ({ ...step, failed: false, sharedStep: { ...step.sharedStep!, revision: null } })) };
  const render = () => nodes(h.render(() => View({ reproduction: manual, ru: true })));
  invoke(render().find(node => node.type === "Button")!, "onPress");
  assert.ok(render().some(node => node.props.children === "Инструкции воспроизведения из выбранных версий общих сценариев."));
  assert.ok(!render().some(node => node.props["data-failed"]));
  assert.equal(h.render(() => View({ reproduction: null, ru: true })), null);
});
