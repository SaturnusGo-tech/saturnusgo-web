import assert from "node:assert/strict";
import test from "node:test";
import { formHarness } from "../forms/form-harness";
import { invoke } from "../../../../portfolios/tests/support/component-harness";
import { portfolioCopy } from "../../../../portfolios/model/copy";
import { organizationErrors, focusOrganizationError } from "../../../../portfolios/presentation/editor/validation/validate";
import type { usePortfoliosView } from "../../../../portfolios/state/view/usePortfoliosView";

const tick = () => new Promise(resolve => setImmediate(resolve));
test("portfolio form registers prefilled values and pending, confirms cancel, releases only after persistence", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let closed = 0, persisted = false;
  const current = { id: "portfolio", name: "Payments", description: "Existing", responsibleIdentityId: null, workflowPhase: "new", checklist: [] };
  const { PortfolioEditorPage: View } = f.load<{ PortfolioEditorPage: (props: Record<string, unknown>) => unknown }>(new URL("../../../../portfolios/presentation/editor/PortfolioEditorPage.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("management/model/copy")) return { organizationCopy: () => ({ phase: "Phase" }) };
    if (name.endsWith("validation/validate")) return { organizationErrors, focusOrganizationError };
    return undefined;
  });
  const props = { current, workspaceId: "w", copy: portfolioCopy("en"), pending: false, error: null,
    onCancel() { closed++; }, onSave: async (_draft: unknown, onSaved?: () => void) => { if (persisted) onSaved?.(); } };
  const render = () => f.render(() => View(props));
  render(); assert.equal(f.session()?.dirty, false);
  invoke(render().find(node => node.type === "OrganizationMarkdownField")!, "onChange", "Edited"); render(); assert.equal(f.session()?.dirty, true);
  await invoke(render().find(node => node.type === "EditorActions")!, "onCancel"); assert.equal(closed, 0);
  await invoke(render().find(node => node.type === "form")!, "onSubmit", { preventDefault() {} }); await tick(); assert.equal(f.released(), 0);
  props.pending = true; render(); assert.equal(f.session()?.busy, true);
  props.pending = false; persisted = true;
  await invoke(render().find(node => node.type === "form")!, "onSubmit", { preventDefault() {} }); await tick(); assert.equal(f.released(), 1);
});

test("portfolio catalog navigation commits only after approval and successful save releases before navigating", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let allowed = false, succeeded = false;
  const events: string[] = [];
  const { usePortfoliosView: useView } = f.load<{ usePortfoliosView: typeof usePortfoliosView }>(new URL("../../../../portfolios/state/view/usePortfoliosView.ts", import.meta.url), name => {
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: async (action: () => void) => { if (allowed) action(); return allowed; } };
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("useCatalogPage")) return { useCatalogPage: () => ({ reload() {} }) };
    if (name.endsWith("useResource")) return { useResource: () => ({ reload() {} }) };
    if (name.endsWith("useCatalogActions")) return { useCatalogActions: () => ({}) };
    if (name.endsWith("usePortfolioCommand")) return { usePortfolioCommand: () => ({ run: async () => succeeded ? { data: { id: "new" } } : null }) };
    return undefined;
  });
  const render = () => f.h.render(() => useView({ workspaceId: "w", offline: false, route: { kind: "portfolio-create" },
    onNavigate: () => { events.push("navigate"); }, onActivateProject: async () => true, projectCases: null, onProjectCreated() {}, onProjectUpdated() {} }));
  render().navigate({ kind: "catalog" }); await tick(); assert.equal(events.length, 0);
  allowed = true; render().navigate({ kind: "catalog" }); await tick(); assert.deepEqual(events, ["navigate"]); events.length = 0;
  const save = render().save as (draft: { name: string }, onSaved: () => void) => Promise<void>;
  await save({ name: "New" }, () => events.push("saved")); assert.equal(events.length, 0);
  succeeded = true; await save({ name: "New" }, () => events.push("saved")); await tick(); assert.deepEqual(events, ["saved", "navigate"]);
});
