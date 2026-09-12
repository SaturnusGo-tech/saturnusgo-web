import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { getSuiteDialogCopy } from "../../copy";
import type { SuiteEditableFields } from "../SuiteEditableFields";

test("title and description open in place on click; rich Markdown drafts can be applied or cancelled", () => {
  const h = componentHarness();
  const { SuiteEditableFields: View } = h.load<{ SuiteEditableFields: typeof SuiteEditableFields }>(new URL("../SuiteEditableFields.tsx", import.meta.url), name => name === "../copy" ? { getSuiteDialogCopy } : undefined);
  const values = { name: "Release", description: "## Original", type: "static" as "static" | "dynamic", tags: "smoke" };
  const render = () => nodes(h.render(() => View({ ...values, creating: false, ru: true, folders: [], onName: value => { values.name = value; }, onDescription: value => { values.description = value; }, onType: value => { values.type = value; }, onTags: value => { values.tags = value; } })));
  let all = render();
  invoke(all.find(node => node.props["aria-label"] === "Изменить: Название сьюта")!, "onClick");
  all = render(); invoke(all.find(node => node.type === "input")!, "onChange", { target: { value: "Release 2.5" } });
  invoke(render().find(node => node.props["aria-label"] === "Готово")!, "onClick"); assert.equal(values.name, "Release 2.5");
  all = render(); invoke(all.find(node => node.type === "MarkdownField")!, "onRequestEdit");
  const editor = render().find(node => node.type === "MarkdownField")!;
  assert.equal(editor.props.appearance, "plain"); assert.equal(typeof editor.props.onChange, "function");
  invoke(editor, "onChange", "# Plan\n\n- **Check login**\n- ==blue|Highlighted==");
  invoke(render().find(node => node.props["aria-label"] === "Готово")!, "onClick");
  assert.equal(render().find(node => node.type === "MarkdownField")!.props.value, values.description);
  invoke(render().find(node => node.type === "MarkdownField")!, "onRequestEdit");
  invoke(render().find(node => node.type === "MarkdownField")!, "onChange", "discard me");
  invoke(render().find(node => node.props["aria-label"] === "Отменить изменение поля")!, "onClick");
  assert.equal(values.description.startsWith("# Plan"), true); h.dispose();
});
test("membership label opens controls and cancelling restores its type and tags", () => {
  const h = componentHarness();
  const { SuiteEditableFields: View } = h.load<{ SuiteEditableFields: typeof SuiteEditableFields }>(new URL("../SuiteEditableFields.tsx", import.meta.url), name => name === "../copy" ? { getSuiteDialogCopy } : undefined);
  let type: "static" | "dynamic" = "static", tags = "smoke";
  const render = () => nodes(h.render(() => View({ name: "Release", description: "", type, tags, creating: false, ru: false, folders: [], onName() {}, onDescription() {}, onType: value => { type = value; }, onTags: value => { tags = value; } })));
  invoke(render().find(node => String(node.props["aria-label"]).startsWith("How to choose cases:"))!, "onClick");
  invoke(render().filter(node => node.type === "button" && node.props["aria-pressed"] !== undefined)[1], "onClick");
  invoke(render().find(node => node.type === "input")!, "onChange", { target: { value: "smoke, api" } });
  invoke(render().find(node => node.props["aria-label"] === "Discard field changes")!, "onClick");
  assert.equal(type, "static"); assert.equal(tags, "smoke"); h.dispose();
});
