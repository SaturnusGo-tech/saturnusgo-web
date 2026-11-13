import assert from "node:assert/strict";
import test from "node:test";
import { invoke } from "../../../../portfolios/tests/support/component-harness";
import { formHarness } from "../forms/form-harness";
import { resolvePendingOperation } from "../../../../../../core/tms/idempotency/pending-operation";
import { getProjectDialogCopy } from "../../../../presentation/dialogs/project/copy";
import { portfolioCopy } from "../../../../portfolios/model/copy";
import type { useProjectForm } from "../../../../projects/state/dialog/useProjectForm";

const project = { id: "p", key: "PAY", name: "Payments", description: "Initial", portfolioId: "portfolio", responsibleIdentityId: "qa", testingPlan: "Plan", workflowPhase: "new" as const, checklist: [] };
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup() {
  const f = formHarness(); let success = false, complete: (() => void) | undefined;
  const form = f.load<{ useProjectForm: typeof useProjectForm }>(new URL("../../../../projects/state/dialog/useProjectForm.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("pending-operation")) return { resolvePendingOperation };
    if (name.endsWith("mutation-failure")) return { formatTmsMutationFailure: () => "Failed", toTmsMutationFailure: () => ({}) };
    if (name.endsWith("createProject")) return { updateProject: async () => {
      await new Promise<void>(resolve => { complete = resolve; });
      return success ? { data: project, etag: "v2" } : { ok: false, failure: {} };
    } };
    return undefined;
  });
  return { f, form, finish: (saved: boolean) => { success = saved; complete?.(); } };
}
test("real project form baselines every authoring field and retains changed data after failed save", async t => {
  const { f, form, finish } = setup(); t.after(() => f.h.dispose());
  const render = () => f.h.render(() => form.useProjectForm({ workspaceId: "w", project, projectEtag: "v1", offline: false, errorText: "Failed" }));
  let value = render(); assert.equal(f.session()?.dirty, false);
  value.setTestingPlan("Updated plan"); value = render(); assert.equal(f.session()?.dirty, true);
  value.setTestingPlan("Plan"); value = render(); assert.equal(f.session()?.dirty, false);
  value.setChecklist([{ id: "check", text: "Test API", completed: false }]); value = render(); assert.equal(f.session()?.dirty, true);
  const failed = value.save(); render(); assert.equal(f.session()?.busy, true);
  finish(false); await failed; value = render(); assert.equal(f.session()?.dirty, true); assert.equal(f.released(), 0);
  const saved = value.save(); render(); finish(true); await saved; render();
  assert.equal(f.session()?.dirty, false); assert.equal(f.session()?.busy, false); assert.ok(f.released() > 0);
});

test("inline project Escape and Cancel go through the shared confirmation", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let closed = 0, attempts = 0;
  const request = async (action: () => void) => { attempts++; return false; };
  const { ProjectInlineEditor: Editor } = f.load<{ ProjectInlineEditor: (props: Record<string, unknown>) => unknown }>(new URL("../../../../presentation/config/general/ProjectInlineEditor.tsx", import.meta.url), name => {
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: request };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("project/copy")) return { getProjectDialogCopy };
    if (name.endsWith("portfolios/model/copy")) return { portfolioCopy };
    if (name.endsWith("useProjectForm")) return { useProjectForm: () => ({ ...project, pending: false, modified: true }) };
    if (name.endsWith("useProjectPortfolioOptions")) return { useProjectPortfolioOptions: () => ({ items: [] }) };
    return undefined;
  });
  const render = () => f.render(() => Editor({ project, etag: "v1", workspaceId: "w", offline: false, onBusy() {}, onCancel() { closed++; }, onSaved() {} }));
  invoke(render().find(node => node.type === "form")!, "onKeyDown", { key: "Escape", preventDefault() {}, stopPropagation() {} });
  invoke(render().find(node => node.type === "button" && node.props.children === "Cancel")!, "onClick");
  await tick(); assert.equal(attempts, 2); assert.equal(closed, 0);
});

test("project settings Collapse cannot bypass the inline editor leave confirmation", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let attempts = 0;
  const { ProjectSettings: View } = f.load<{ ProjectSettings: (props: Record<string, unknown>) => unknown }>(new URL("../../../../presentation/config/sections/ProjectSettings.tsx", import.meta.url), name => {
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: async () => { attempts++; return false; } };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: () => "Edit" }) };
    if (name.endsWith("portfolios/model/copy")) return { portfolioCopy };
    if (name.endsWith("settings-sections")) return { settingsCopy: { en: { archiveHint: "Archive" } } };
    if (name.endsWith("useProjectSettingsEditor")) return { useProjectSettingsEditor: () => ({ resource: { data: project, etag: "v1" }, load() {}, close() {} }) };
    if (name.endsWith("useDisclosureMotion")) return { useDisclosureMotion: (open: boolean) => ({ present: open, ref: {} }) };
    return undefined;
  });
  const render = () => f.render(() => View({ project, workspaceId: "w", offline: false, canManage: true, onUpdated() {}, onToggle() {} }));
  const trigger = () => render().find(node => node.type === "button" && "aria-expanded" in node.props)!;
  invoke(trigger(), "onClick"); assert.equal(trigger().props["aria-expanded"], true);
  invoke(trigger(), "onClick"); await tick(); assert.equal(trigger().props["aria-expanded"], true); assert.equal(attempts, 1);
});


test("changing the project scope baselines its own metadata instead of retaining the previous project", async t => {
  const { f, form } = setup(); t.after(() => f.h.dispose());
  let current = project;
  const render = () => f.h.render(() => form.useProjectForm({ workspaceId: "w", project: current, projectEtag: "v1", offline: false, errorText: "Failed" }));
  render().updateName("Unsaved old project"); render(); assert.equal(f.session()?.dirty, true);
  current = { ...project, id: "second", name: "Second project", testingPlan: "Second plan" };
  render(); const changed = render();
  assert.equal(changed.name, "Second project"); assert.equal(changed.testingPlan, "Second plan"); assert.equal(f.session()?.dirty, false);
  changed.updateName("Second edited"); render(); assert.equal(f.session()?.dirty, true);
});
