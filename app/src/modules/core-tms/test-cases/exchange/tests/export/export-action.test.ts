import assert from "node:assert/strict";
import test from "node:test";
import type { ExportCasesAction } from "../../library/presentation/export/ExportCasesAction";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";

const projects = [{ id: "a", key: "A", name: "Alpha" }, { id: "b", key: "B", name: "Другой проект" }];
function fixture(ru = false, disabled = false, initial = projects[0], reducedMotion = false) {
  const h = componentHarness(); let selected = "", starts = 0, cancels = 0;
  const { ExportCasesAction: View } = h.load<{ ExportCasesAction: typeof ExportCasesAction }>(new URL("../../library/presentation/export/ExportCasesAction.tsx", import.meta.url), name => {
    if (name === "framer-motion") return { useReducedMotion: () => reducedMotion };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: ru ? "ru" : "en", t: (key: string) => key }) };
    if (name.endsWith("use-export-cases")) return { useExportCases: (project: typeof projects[number]) => {
      selected = project.id;
      return { busy: false, error: "", completed: null, start: async () => { starts++; }, cancel: () => { cancels++; } };
    } };
  });
  const render = () => nodes(h.render(() => View({ projects, project: initial, enabled: true, disabled })));
  return { render, state: () => ({ selected, starts, cancels }) };
}

test("export first opens a project picker and downloads only after explicit confirmation", () => {
  const f = fixture(); const initial = f.render();
  const trigger = initial.find(node => node.type === "Button")!; assert.ok(trigger);
  invoke(trigger, "onPress"); assert.equal(f.state().starts, 0);
  const dialog = f.render(); assert.ok(dialog.some(node => node.type === "Modal" && node.props.isOpen));
  const picker = dialog.find(node => node.type === "Select")!; assert.ok(picker);
  assert.equal(dialog.filter(node => node.type === "SelectItem").length, 2);
  invoke(picker, "onSelectionChange", new Set(["b"]));
  const changed = f.render(); assert.equal(f.state().selected, "b");
  assert.match(JSON.stringify(changed), /Другой проект/); assert.match(JSON.stringify(changed), /archived/i);
  const download = changed.find(node => node.type === "Button" && String(node.props["aria-label"]).startsWith("Download JSON for Другой проект"))!;
  assert.equal((download.props.spinner as { type: string }).type, "LoadingOrb");
  invoke(download, "onPress"); assert.equal(f.state().starts, 1);
  invoke(changed.find(node => node.type === "Modal")!, "onClose");
  invoke(f.render().find(node => node.type === "Button")!, "onPress"); f.render();
  assert.equal(f.state().selected, "b");
});

test("closing cancels export and Russian copy keeps the selected project visible", () => {
  const f = fixture(true); invoke(f.render().find(node => node.type === "Button")!, "onPress");
  const dialog = f.render(); assert.match(JSON.stringify(dialog), /Проект|проект/);
  invoke(dialog.find(node => node.type === "Modal")!, "onClose");
  assert.ok(f.state().cancels > 0); assert.equal(f.render().some(node => node.type === "Modal" && node.props.isOpen), false);
});

test("an import in progress prevents opening or starting export", () => {
  const f = fixture(false, true); const trigger = f.render().find(node => node.type === "Button")!;
  assert.equal(trigger.props.isDisabled, true); invoke(trigger, "onPress");
  assert.equal(f.render().some(node => node.type === "Modal" && node.props.isOpen), false); assert.equal(f.state().starts, 0);
});


test("an unavailable initial project requires a real selection instead of choosing the first project", () => {
  const f = fixture(false, false, { id: "missing", key: "M", name: "Unavailable" });
  invoke(f.render().find(node => node.type === "Button")!, "onPress");
  const dialog = f.render(), picker = dialog.find(node => node.type === "Select")!;
  assert.deepEqual(Array.from(picker.props.selectedKeys as Iterable<string>), []);
  const confirm = dialog.find(node => node.type === "Button" && String(node.props["aria-label"]).startsWith("Download JSON for"))!;
  assert.equal(confirm.props.isDisabled, true); invoke(confirm, "onPress"); assert.equal(f.state().starts, 0);
  invoke(picker, "onSelectionChange", new Set(["b"]));
  const selected = f.render().find(node => node.type === "Select")?.props.selectedKeys as string[];
  assert.equal(selected[0], "b");
});

test("the export modal honors reduced motion", () => {
  const f = fixture(false, false, projects[0], true); invoke(f.render().find(node => node.type === "Button")!, "onPress");
  const modal = f.render().find(node => node.type === "Modal")!;
  assert.equal(modal.props.disableAnimation, true);
  assert.equal((modal.props.motionProps as { transition: { duration: number } }).transition.duration, 0);
});
