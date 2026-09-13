import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as model from "../../model";
import { createEmptyRevision } from "../../../../../helpers/cases/caseRevision";

type Node = { type: string; props: Record<string, unknown> };
function render(path: string, exported: string, props: unknown, menu = false) {
  let stateIndex = 0;
  const module = { exports: {} as Record<string, (props: unknown) => unknown> };
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const jsx = (type: string, props: Record<string, unknown>) => ({ type, props });
  const proxy = new Proxy({}, { get: (_target, key) => String(key) });
  runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { module, exports: module.exports,
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useState: (initial: unknown) => [menu && stateIndex++ === 1 ? true : typeof initial === "function" ? initial() : initial, () => {}],
        useEffect: () => {}, useRef: (current: unknown) => ({ current }), useId: () => "inspector",
      };
      if (name.endsWith("inspector/model") || name === "./model") return model;
      if (name.endsWith("useCaseActivityNavigation")) return { useCaseActivityNavigation: () => {} };
      if (name.endsWith("CaseAttachmentDraftContext")) return { useCaseAttachmentDraft: () => undefined, CaseAttachmentDraftProvider: "CaseAttachmentDraftProvider" };
      if (name.endsWith("collaboration/model")) return { caseActivityForKey: () => [] };
      if (name.endsWith("test-case-collaboration")) return { readyDefectCount: () => 0 };
      if (name.endsWith("format/labels")) return { localizedComponentLabel: () => "Payments" };
      if (name.endsWith(".css")) return { default: proxy };
      return proxy;
    },
  });
  return nodes(module.exports[exported](props));
}
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
function invoke(node: Node, event = "onClick", argument?: unknown) { (node.props[event] as (arg?: unknown) => void)(argument); }
const revision = { ...createEmptyRevision("en"), title: "Saved title", description: "Saved description" };
const archivedCase = { id: "case", key: "TC-1", projectId: "project", archivedAt: "2026-09-09T12:00:00Z",
  createdAt: "2026-09-08T12:00:00Z", updatedAt: "2026-09-09T12:00:00Z" };

test("archived header blocks run and clone while restore and navigation remain available", () => {
  const calls: string[] = [];
  const all = render("../../../detail/header/CaseDetailHeaderActions.tsx", "CaseDetailHeaderActions", {
    locale: "en", testCase: archivedCase, creating: false, editorOpen: false,
    onRunCase: () => calls.push("run"), onClone: () => calls.push("clone"), onArchive: () => calls.push("restore"),
    onToggleFullscreen: () => calls.push("fullscreen"), onClose: () => calls.push("close"),
  }, true);
  for (const label of ["Run", "Create a copy"]) {
    const button = all.find(node => node.type === "button" && text(node.props.children) === label)!;
    assert.equal(button.props.disabled, true); invoke(button);
  }
  assert.deepEqual(calls, []);
  for (const label of ["Copy ID", "Copy link", "Restore"]) {
    const button = all.find(node => node.type === "button" && text(node.props.children) === label)!;
    assert.notEqual(button.props.disabled, true);
    if (label === "Restore") invoke(button);
  }
  for (const label of ["Open full screen", "Close"]) invoke(all.find(node => node.props["aria-label"] === label)!);
  assert.deepEqual(calls, ["restore", "fullscreen", "close"]);
});

test("archived inspector refuses edits and draft changes, while active creation stays canonical", () => {
  let edits = 0; let changes = 0;
  const editor = { mode: "edit", value: { ...revision, description: "Unsaved draft" }, folders: [], components: [],
    onChange: () => { changes++; } };
  const props = { locale: "en", revision, archived: true, editor, sharedSteps: [], onRequestEdit: () => { edits++; } };
  const all = render("../../CaseInspectorContent.tsx", "CaseInspectorContent", props);
  const sections = all.filter(node => node.type === "InspectorSectionView");
  assert.equal(sections.length, 6);
  for (const section of sections) {
    assert.equal(section.props.editing, false); assert.equal(section.props.disabled, true);
    invoke(section, "onEdit", section.props.section);
  }
  const steps = all.find(node => node.type === "InspectorSteps")!;
  assert.equal(steps.props.editing, false); invoke(steps, "onPatch", { description: "Blocked" });
  assert.equal(all.find(node => node.type === "CaseMetadataControls")!.props.onChange, undefined);
  assert.equal(all.find(node => node.type === "MarkdownField")!.props.value, "Saved description");
  assert.equal(edits, 0); assert.equal(changes, 0);
  const active = render("../../CaseInspectorContent.tsx", "CaseInspectorContent", { ...props, archived: false, editor: undefined });
  invoke(active.find(node => node.type === "InspectorSectionView")!, "onEdit", "description");
  assert.equal(edits, 1);
  const creation = render("../../CaseInspectorContent.tsx", "CaseInspectorContent", { ...props, editor: { ...editor, mode: "create" } });
  assert.equal(creation[0].type, "CaseCreationSections");
});

test("archiving an open draft disables title/save, retains cancel and displays the stored revision", () => {
  let edits = 0; let runs = 0; let submits = 0; let cancels = 0; let prevented = 0;
  const all = render("../../../detail/CaseDetailPanel.tsx", "CaseDetailPanel", {
    locale: "en", languageTag: "en-US", testCase: archivedCase, revision, activity: [], collaboration: { defects: { items: [] } },
    editor: { mode: "edit", value: { ...revision, title: "Unsaved title" }, folderPath: "/Archived", onSubmit: () => { submits++; }, onCancel: () => { cancels++; } },
    onEdit: () => { edits++; }, onRunCase: () => { runs++; },
  });
  const title = all.find(node => node.props["aria-label"] === "Edit title")!;
  assert.equal(title.props.disabled, true); invoke(title);
  assert.equal(all.some(node => node.props["data-inline-title"]), false);
  const overview = all.find(node => node.type === "CaseOverview")!;
  assert.equal(overview.props.editor, undefined); assert.equal((overview.props.revision as { title: string }).title, "Saved title");
  invoke(overview, "onRequestEdit"); invoke(all.find(node => node.type === "CaseDetailHeaderActions")!, "onRunCase");
  assert.equal(all.find(node => node.type === "CaseAttachmentDraftProvider")!.props.enabled, false);
  invoke(all.find(node => node.type === "form")!, "onSubmit", { preventDefault: () => { prevented++; } });
  assert.equal(all.find(node => node.type === "button" && text(node.props.children) === "Save")!.props.disabled, true);
  invoke(all.find(node => node.type === "button" && text(node.props.children) === "Cancel")!);
  assert.deepEqual([edits, runs, submits, cancels, prevented], [0, 0, 0, 1, 1]);
});
