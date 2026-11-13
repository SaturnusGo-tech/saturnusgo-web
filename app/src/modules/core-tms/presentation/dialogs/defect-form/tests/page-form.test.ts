import test from "node:test";
import assert from "node:assert/strict";
import type { DefectForm } from "../DefectForm";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { getDefectDialogCopy } from "../../defect/copy";
import { validateDefectDraft } from "../validation/validateDefectDraft";

test("bug creation uses the shared drawer, a property rail and a pinned submit footer", () => {
  const h = componentHarness(); let submitted = 0, closed = 0; const patches: unknown[] = [];
  const { DefectForm: View } = h.load<{ DefectForm: typeof DefectForm }>(new URL("../DefectForm.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("copy")) return { getDefectDialogCopy };
    if (name.endsWith("validateDefectDraft")) return { validateDefectDraft };
  });
  const props: Parameters<typeof DefectForm>[0] = { workspaceId: "w", offline: false, context: "TC-1 · QA", value: {
    title: "Missing order", description: "**Steps** to reproduce", actualResult: "No order", expectedResult: "Order appears", component: "Orders", severity: "high", priority: "medium", reproducibility: "Always", assigneeIdentityId: null, link: "https://api.test/orders",
  }, onChange: patch => patches.push(patch), components: [], routing: { value: "", onChange() {}, options: [], disabled: false, resolved: true, message: "" }, files: [], onFilesChange() {}, submitting: false, closing: false, error: "", panelRef: { current: null }, onSubmit: () => { submitted++; }, onClose: () => { closed++; } };
  let all = nodes(h.render(() => View(props)));
  assert.equal(all[0].type, "Modal");
  assert.equal(all[0].props.drawer, true);
  assert.equal(all[0].props.title, "New bug report");
  const layout = all.find(node => node.props["data-defect-create-layout"]);
  assert.equal(nodes(layout?.props.children).filter(node => ["main", "DefectProperties"].includes(node.type)).map(node => node.type).join(","), "main,DefectProperties");
  const footer = all.find(node => node.type === "footer");
  assert.equal(nodes(footer).some(node => node.props["data-testid"] === "create-defect"), true);
  assert.equal(all.find(node => node.props["data-testid"] === "defect-title")?.props["aria-required"], "true");
  const description = all.find(node => node.type === "CreationNarrativeSection");
  assert.ok(description, "description uses the same editor as testcase creation");
  invoke(description, "onChange", "## Updated Markdown"); assert.deepEqual(JSON.parse(JSON.stringify(patches[0])), { description: "## Updated Markdown" });
  const results = all.find(node => node.type === "DefectResults");
  assert.ok(results, "actual and expected results use the testcase scenario editor");
  assert.equal(results.props.actual, "No order"); assert.equal(results.props.expected, "Order appears");
  invoke(results, "onActualChange", "**Observed** result");
  invoke(results, "onExpectedChange", "Expected result\n- preserved");
  assert.deepEqual(JSON.parse(JSON.stringify(patches.slice(1))), [{ actualResult: "**Observed** result" }, { expectedResult: "Expected result\n- preserved" }]);
  invoke(all.find(node => node.type === "form")!, "onSubmit", { preventDefault() {} }); assert.equal(submitted, 1);
  invoke(all[0], "onClose"); assert.equal(closed, 1);
  props.submitting = true; all = nodes(h.render(() => View(props)));
  assert.equal(all.find(node => node.props["data-testid"] === "create-defect")?.props.disabled, true);
  assert.equal(all.find(node => node.type === "button" && node.props.children === "Cancel")?.props.disabled, true);
  invoke(all.find(node => node.type === "form")!, "onSubmit", { preventDefault() {} }); assert.equal(submitted, 1);
});
