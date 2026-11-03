import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { getSuiteDialogCopy } from "../../copy";
import type { SuiteEditableFields } from "../SuiteEditableFields";

test("suite name and membership are directly editable without opening nested field panels", () => {
  const h = componentHarness();
  const { SuiteEditableFields: View } = h.load<{ SuiteEditableFields: typeof SuiteEditableFields }>(new URL("../SuiteEditableFields.tsx", import.meta.url), name => name === "../copy" ? { getSuiteDialogCopy } : undefined);
  const values = { name: "Release", description: "", type: "static" as "static" | "dynamic", tags: "smoke" };
  const render = () => nodes(h.render(() => View({ ...values, creating: false, ru: false, folders: [], onName: value => { values.name = value; }, onDescription: value => { values.description = value; }, onType: value => { values.type = value; }, onTags: value => { values.tags = value; } })));
  invoke(render().find(node => node.type === "input")!, "onChange", { target: { value: "Release 2.5" } });
  assert.equal(values.name, "Release 2.5");
  invoke(render().filter(node => node.type === "button" && node.props["aria-pressed"] !== undefined)[1], "onClick");
  const inputs = render().filter(node => node.type === "input");
  invoke(inputs[1], "onChange", { target: { value: "smoke, api" } });
  assert.equal(values.type, "dynamic"); assert.equal(values.tags, "smoke, api");
  h.dispose();
});
test("optional description uses shared rich Markdown and keeps its draft when compacted", () => {
  const h = componentHarness();
  const { SuiteEditableFields: View } = h.load<{ SuiteEditableFields: typeof SuiteEditableFields }>(new URL("../SuiteEditableFields.tsx", import.meta.url), name => name === "../copy" ? { getSuiteDialogCopy } : undefined);
  let description = "## Original";
  const render = () => nodes(h.render(() => View({ name: "Release", description, type: "static", tags: "smoke", creating: false, ru: true, folders: [], onName() {}, onDescription: value => { description = value; }, onType() {}, onTags() {} })));
  invoke(render().find(node => node.type === "MarkdownField")!, "onRequestEdit");
  const editor = render().find(node => node.type === "MarkdownField")!;
  assert.equal(editor.props.appearance, "plain");
  invoke(editor, "onChange", "# Plan\n\n- **Check login**\n- ==blue|Highlighted==");
  invoke(render().find(node => node.type === "button" && node.props.children === "Готово")!, "onClick");
  const readable = render().find(node => node.type === "MarkdownField")!;
  assert.equal(readable.props.value, description); assert.equal(readable.props.onChange, undefined);
  assert.equal(description.startsWith("# Plan"), true); h.dispose();
});
test("Add description opens the existing Markdown editor without an empty preview taking space", () => {
  const h = componentHarness();
  const { SuiteEditableFields: View } = h.load<{ SuiteEditableFields: typeof SuiteEditableFields }>(new URL("../SuiteEditableFields.tsx", import.meta.url), name => name === "../copy" ? { getSuiteDialogCopy } : undefined);
  let description = "";
  const render = () => nodes(h.render(() => View({ name: "Release", description, type: "static", tags: "", creating: true, ru: false, folders: [], onName() {}, onDescription: value => { description = value; }, onType() {}, onTags() {} })));
  assert.equal(render().some(node => node.type === "MarkdownField"), false);
  invoke(render().find(node => node.type === "button" && node.props.children === "Add description")!, "onClick");
  const editor = render().find(node => node.type === "MarkdownField")!;
  assert.equal(editor.props.autoFocus, true); assert.equal(editor.props.allowAttachments, false);
  invoke(editor, "onChange", "**Release scope:** booking and payments");
  invoke(render().find(node => node.type === "button" && node.props.children === "Done")!, "onClick");
  const preview = render().find(node => node.type === "MarkdownField")!;
  assert.equal(preview.props.value, description); assert.equal(preview.props.onChange, undefined);
  invoke(render().find(node => node.type === "button" && node.props.children === "Edit description")!, "onClick");
  invoke(render().find(node => node.type === "MarkdownField")!, "onChange", "");
  invoke(render().find(node => node.type === "button" && node.props.children === "Done")!, "onClick");
  assert.equal(render().some(node => node.type === "MarkdownField"), false); h.dispose();
});
test("retained folder criteria use shared breadcrumbs without remapping a saved folder identity", () => {
  for (const [folderId, folderPathPrefix, expectedPath, unavailable] of [["stable", "/Previous", "/Renamed/Calendar", false], ["missing", "/Renamed/Calendar", "/Renamed/Calendar", true], [undefined, "/", "/", false]] as const) {
    const h = componentHarness();
    const { SuiteEditableFields: View } = h.load<{ SuiteEditableFields: typeof SuiteEditableFields }>(new URL("../SuiteEditableFields.tsx", import.meta.url), name => name === "../copy" ? { getSuiteDialogCopy } : undefined);
    const retainedFilter = { folderId, folderPathPrefix, tags: [] };
    const all = nodes(h.render(() => View({ name: "Release", description: "", type: "dynamic", tags: "", creating: false, ru: false,
      retainedFilter, folders: [{ id: "stable", appearance: null, path: "/Renamed/Calendar", name: "Calendar", workspaceId: "w", projectId: "p", parentId: null,
        rowVersion: 1, archivedAt: null, createdAt: "2026-11-02T00:00:00Z", updatedAt: "2026-11-02T00:00:00Z", etag: "folder-v1" }],
      onName() {}, onDescription() {}, onType() {}, onTags() {} })));
    const path = all.find(node => node.type === "SuiteFolderPath")!;
    assert.equal(path.props.path, expectedPath); assert.equal(path.props.unavailable, unavailable);
    assert.equal(retainedFilter.folderId, folderId); assert.equal(retainedFilter.folderPathPrefix, folderPathPrefix); h.dispose();
  }
});
