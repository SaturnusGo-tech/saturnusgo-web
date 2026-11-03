import test from "node:test";
import assert from "node:assert/strict";
import type { DefectForm } from "../DefectForm";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { getDefectDialogCopy } from "../../defect/copy";
import { validateDefectDraft } from "../validation/validateDefectDraft";

test("bug report page exposes ordinary page semantics, compact title and established Markdown fields", () => {
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
  assert.equal(all[0].type, "DefectPageHost");
  assert.equal(all.some(node => node.type === "Modal" || node.type === "AppOverlay" || node.props.role === "dialog" || node.props["aria-modal"]), false);
  assert.equal(all.find(node => node.type === "h1")?.props.children, "New bug report");
  assert.equal(all.find(node => node.props["data-testid"] === "defect-title")?.props["aria-required"], "true");
  const narratives = all.filter(node => node.type === "NarrativeField"); assert.equal(narratives.length, 3);
  invoke(narratives[0], "onChange", "## Updated Markdown"); assert.deepEqual(JSON.parse(JSON.stringify(patches[0])), { description: "## Updated Markdown" });
  invoke(all.find(node => node.type === "form")!, "onSubmit", { preventDefault() {} }); assert.equal(submitted, 1);
  invoke(all.find(node => node.props["data-defect-page"])!, "onKeyDown", { key: "Escape", defaultPrevented: false, preventDefault() {} }); assert.equal(closed, 1);
  props.submitting = true; all = nodes(h.render(() => View(props)));
  assert.equal(all[0].props.pending, true);
  assert.equal(all.find(node => node.props["data-testid"] === "create-defect")?.props.disabled, true);
  assert.equal(all.find(node => node.type === "button" && node.props.children === "Cancel")?.props.disabled, true);
  invoke(all.find(node => node.type === "form")!, "onSubmit", { preventDefault() {} }); assert.equal(submitted, 1);
});
