import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { setImmediate as flush } from "node:timers/promises";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as model from "../../model";
import * as markdownImages from "../../attachments/links/caseMarkdownImages";
import { createEmptyRevision } from "../../../../../helpers/cases/caseRevision";

type Node = { type: string; props: Record<string, unknown> };
function render(path: string, exported: string, props: unknown, confirmation?: "restore" | "quarantine") {
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
        useState: (initial: unknown) => [stateIndex++ === 1 && confirmation ? confirmation : typeof initial === "function" ? initial() : initial, () => {}],
        useEffect: () => {}, useMemo: (value: () => unknown) => value(), useRef: (current: unknown) => ({ current }), useId: () => "inspector",
      };
      if (name.endsWith("inspector/model") || name === "./model") return model;
      if (name.endsWith("caseMarkdownImages")) return markdownImages;
      if (name.endsWith("useCaseAuthoringSession")) return { useCaseAuthoringSession: () => ({ release() {} }) };
      if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: async (action: (commit: (update: () => void) => void) => unknown) => { await action(update => update()); return true; } };
      if (name.endsWith("useCaseActivityNavigation")) return { useCaseActivityNavigation: () => {} };
      if (name.endsWith("useCasePanelExit")) return { useCasePanelExit: () => (close: () => void) => close() };
      if (name.endsWith("useCreateCaseEntrance")) return { useCreateCaseEntrance: () => {} };
      if (name.endsWith("useScenarioLayout")) return { useScenarioLayout: () => ["list", () => {}] };
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
  });
  const run = all.find(node => node.type === "button" && text(node.props.children) === "Run")!;
  assert.equal(run.props.disabled, true); invoke(run);
  const menu = all.find(node => node.type === "DropdownMenu")!;
  assert.ok((menu.props.disabledKeys as string[]).includes("clone"));
  invoke(menu, "onAction", "clone");
  assert.deepEqual(Array.from(nodes(menu.props.children).filter(node => node.type === "DropdownItem"), node => node.props.textValue),
    ["Copy ID", "Copy link", "Create a copy", "Restore"]);
  invoke(menu, "onAction", "restore");
  assert.deepEqual(calls, [], "menu actions open confirmation before a mutation");
  for (const label of ["Open full screen", "Close"]) invoke(all.find(node => node.props["aria-label"] === label)!);
  assert.deepEqual(calls, ["fullscreen", "close"]);
});

test("the quarantine dialog dispatches only after confirming and dismisses only on success", async () => {
  for (const succeeds of [false, true]) {
    let mutations = 0; let dismissals = 0;
    const tree = render("../../../detail/header/CaseDetailHeaderActions.tsx", "CaseDetailHeaderActions", {
      locale: "en", testCase: { ...archivedCase, archivedAt: null }, creating: false, editorOpen: false,
      onArchive: async () => { mutations++; return succeeds; },
    }, "quarantine");
    const dialog = tree.find(node => node.type === "ProductDocModal")!;
    assert.equal(dialog.props.title, "Move this test case to quarantine?");
    const buttons = nodes((dialog.props.children as (dismiss: () => void) => unknown)(() => { dismissals++; }));
    invoke(buttons.find(node => node.type === "Button" && text(node.props.children) === "Cancel")!, "onPress");
    assert.deepEqual([mutations, dismissals], [0, 1]);
    const confirm = buttons.find(node => node.type === "Button" && text(node.props.children) === "Move to quarantine")!;
    invoke(confirm, "onPress"); invoke(confirm, "onPress");
    await flush();
    assert.deepEqual([mutations, dismissals], [1, succeeds ? 2 : 1]);
  }
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

test("saved test data is readable once in Preconditions without a separate editor", () => {
  const inspect = (preconditions: string, testData: string) => render("../../CaseInspectorContent.tsx", "CaseInspectorContent", {
    locale: "en", revision: { ...revision, preconditions, testData }, sharedSteps: [], onRequestEdit() {},
  });
  const section = (all: Node[]) => all.find(node => node.type === "InspectorSectionView" && node.props.section === "preconditions")!;
  const fields = (preconditions: string, testData: string) => nodes(section(inspect(preconditions, testData))).filter(node => node.type === "MarkdownField");
  const withData = fields("User signed in", "Demo booking");
  assert.deepEqual(withData.map(node => node.props.value), ["User signed in", "Demo booking"]);
  assert.equal(withData[1].props.onChange, undefined);
  assert.equal(withData[1].props.allowAttachments, false);
  assert.deepEqual(fields(" Demo booking ", "Demo booking").map(node => node.props.value), [" Demo booking "]);
  assert.deepEqual(fields("", "Demo booking").map(node => node.props.value), ["Demo booking"]);
  assert.equal(fields("", "")[0].props.emptyLabel, "No preconditions specified");
});

test("archiving an open draft disables title/save, retains cancel and displays the stored revision", () => {
  let edits = 0; let runs = 0; let submits = 0; let cancels = 0; let prevented = 0;
  const all = render("../../../detail/CaseDetailPanel.tsx", "CaseDetailPanel", {
    locale: "en", languageTag: "en-US", testCase: archivedCase, revision, activity: [], collaboration: { comments: { items: [] }, defects: { items: [] } },
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

test("creation has one accessible conventional title input instead of duplicate visible title labels", () => {
  const all = render("../../../detail/CaseDetailPanel.tsx", "CaseDetailPanel", {
    locale: "en", languageTag: "en-US", revision, activity: [], collaboration: { comments: { items: [] }, defects: { items: [] } },
    editor: { mode: "create", value: revision, folderPath: "/", onChange() {}, onCancel() {}, onSubmit() {} },
  });
  const inputs = all.filter(node => node.type === "input" && node.props["aria-label"] === "Test case title");
  assert.equal(inputs.length, 1);
  assert.equal(inputs[0].props["data-inline-title"], undefined, "creation must retain its input surface rather than inline-heading styles");
  assert.equal(all.some(node => node.type === "span" && text(node.props.children).includes("Test case title")), false);
});
