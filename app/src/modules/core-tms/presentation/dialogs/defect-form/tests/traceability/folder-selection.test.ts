import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { DefectFolderField } from "../../placement/DefectFolderField";
import type { RepositoryFolder } from "../../../../../folders/model/folder";

test("optional folder is unselected until choosing a stable folder ID or explicit project root", t => {
  const h = componentHarness(); t.after(() => h.dispose()); let selected: string | null | undefined;
  const { DefectFolderField: View } = h.load<{ DefectFolderField: typeof DefectFolderField }>(new URL("../../placement/DefectFolderField.tsx", import.meta.url));
  const folders = [{ id: "folder", path: "/Payments", archivedAt: null }, { id: "archived", path: "/Archived", archivedAt: "2026-11-13" }] as RepositoryFolder[];
  const render = () => nodes(h.render(() => View({ value: selected, choices: { folders, sharedSteps: [] }, ru: false, disabled: false,
    onChange: value => { selected = value; } })));
  assert.equal(render().find(node => node.type === "PropertyPopover")?.props.triggerLabel, "Folder, Choose a folder");
  const picker = render().find(node => node.type === "ParentFolderPicker")!;
  assert.deepEqual(JSON.parse(JSON.stringify(picker.props.options)), [{ value: "/", label: "Project root" }, { value: "/Payments", label: "/Payments" }]);
  invoke(picker, "onChange", "/Payments"); assert.equal(selected, "folder");
  assert.equal(render().find(node => node.type === "ParentFolderPicker")?.props.value, "/Payments");
  invoke(render().find(node => node.type === "ParentFolderPicker")!, "onChange", "/"); assert.equal(selected, null);
  assert.equal(render().find(node => node.type === "PropertyPopover")?.props.triggerLabel, "Folder, /");
  invoke(render().find(node => node.type === "Button")!, "onPress"); assert.equal(selected, undefined);
});

test("loading and failed folder reads cannot select an invented folder", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { DefectFolderField: View } = h.load<{ DefectFolderField: typeof DefectFolderField }>(new URL("../../placement/DefectFolderField.tsx", import.meta.url));
  const tree = nodes(h.render(() => View({ value: undefined, choices: { folders: [], sharedSteps: [], error: "unavailable" }, ru: true, disabled: false, onChange() {} })));
  assert.equal(tree.find(node => node.type === "PropertyPopover")?.props.disabled, true);
  assert.ok(tree.some(node => node.props.role === "status" && node.props.children === "Не удалось загрузить папки."));
});
