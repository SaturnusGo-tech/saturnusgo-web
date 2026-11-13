import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { AuthoringLeaveCoordinator } from "../../../../../authoring/leave/application/leave-coordinator";
import type { CaseInspectorEditor } from "../../../inspector/model";

test("closing the inspector defers animation and all selection changes until leave is approved", async () => {
  const h = componentHarness();
  let intent: (() => void) | undefined;
  const changes: string[] = [];
  const module = h.load<{ leaveCaseInspector: (options: unknown) => Promise<boolean> }>(
    new URL("../../../view/leaveCaseInspector.ts", import.meta.url), name => name.endsWith("authoring-leave")
      ? { requestAuthoringLeave: (action: (commit: (update: () => void) => void) => void) => { intent = () => action(update => update()); return Promise.resolve(false); } } : undefined);
  const options = { editor: { mode: "edit", onCancel: () => changes.push("cancel") } as unknown as CaseInspectorEditor,
    selectedCaseId: "case", onSelectCase: (id: string) => changes.push(`select:${id}`),
    setDetailOpen: (value: boolean) => changes.push(`open:${value}`), setDetailFullscreen: (value: boolean) => changes.push(`full:${value}`),
    animate: (action: () => void) => { changes.push("animate"); action(); } };
  assert.equal(await module.leaveCaseInspector(options), false);
  assert.deepEqual(changes, [], "Stay must preserve the entire panel and its selection");
  intent!();
  assert.deepEqual(changes, ["animate", "cancel", "select:", "full:false", "open:false"]);
  h.dispose();
});

test("discarding a new case restores its previously selected case", async () => {
  const h = componentHarness(); const changes: string[] = [];
  const module = h.load<{ leaveCaseInspector: (options: unknown) => Promise<boolean> }>(
    new URL("../../../view/leaveCaseInspector.ts", import.meta.url), name => name.endsWith("authoring-leave")
      ? { requestAuthoringLeave: async (action: (commit: (update: () => void) => void) => void) => { action(update => update()); return true; } } : undefined);
  assert.equal(await module.leaveCaseInspector({
    editor: { mode: "create", onCancel: () => changes.push("cancel") }, selectedCaseId: "previous",
    onSelectCase: () => changes.push("lost selection"), setDetailOpen: (value: boolean) => changes.push(`open:${value}`),
    setDetailFullscreen: (value: boolean) => changes.push(`full:${value}`),
  }), true);
  assert.deepEqual(changes, ["cancel", "full:false", "open:true"]);
  h.dispose();
});


test("header close delegates to the whole inspector guard before any local exit animation", () => {
  const h = componentHarness(); const events: string[] = [];
  const module = h.load<{ CaseDetailPanel: (props: unknown) => unknown }>(new URL("../../CaseDetailPanel.tsx", import.meta.url), name => {
    if (name.endsWith("useCaseAuthoringSession")) return { useCaseAuthoringSession: () => ({ release() {} }) };
    if (name.endsWith("useCasePanelExit")) return { useCasePanelExit: () => (action: () => void) => { events.push("animation"); action(); } };
    if (name.endsWith("useCreateCaseEntrance")) return { useCreateCaseEntrance() {} };
    if (name.endsWith("useCaseActivityNavigation")) return { useCaseActivityNavigation() {} };
    if (name.endsWith("inspector/model")) return { editorSessionClosed: () => false, caseRevisionAttachmentIds: () => [] };
    if (name.endsWith("caseMarkdownImages")) return { caseMarkdownImages: () => [], caseRevisionMarkdown: () => [] };
    if (name.endsWith("test-case-collaboration")) return { readyDefectCount: () => 0 };
    if (name.endsWith("collaboration/model")) return { caseActivityForKey: () => [] };
  });
  const tree = nodes(h.render(() => module.CaseDetailPanel({ locale: "en", testCase: { id: "case" },
    revision: { title: "Saved", steps: [], checklist: [] }, activity: [], collaboration: { comments: { items: [] }, defects: { items: [] } },
    onClose: () => events.push("whole inspector guard") })));
  (tree.find(node => node.type === "CaseDetailHeaderActions")!.props.onClose as () => void)();
  assert.deepEqual(events, ["whole inspector guard"], "the parent also protects attachment-only comments without an open case editor");
  h.dispose();
});


test("a delayed inspector exit keeps one approval through its guarded selection callback", async () => {
  const h = componentHarness(); const leave = new AuthoringLeaveCoordinator(); let prompts = 0; let selected = 0;
  let frame!: () => void; let complete = false;
  leave.register("comment", () => ({ dirty: true })); leave.setPresenter(async () => { prompts++; return true; });
  const module = h.load<{ leaveCaseInspector: (options: unknown) => Promise<boolean> }>(
    new URL("../../../view/leaveCaseInspector.ts", import.meta.url), () => ({ requestAuthoringLeave: leave.request.bind(leave) }));
  const result = module.leaveCaseInspector({ selectedCaseId: "case", onSelectCase: () => { void leave.request(() => { selected++; }); },
    setDetailOpen() {}, setDetailFullscreen() {}, animate: (action: () => void) => new Promise<void>(resolve => {
      frame = () => { action(); resolve(); };
    }) }).then(value => { complete = true; return value; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(complete, false, "the approval must stay pending until the exit commits");
  frame(); assert.equal(await result, true); assert.equal(prompts, 1); assert.equal(selected, 1); h.dispose();
});
