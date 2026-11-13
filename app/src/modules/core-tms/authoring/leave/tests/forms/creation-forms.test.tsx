import assert from "node:assert/strict";
import test from "node:test";
import { invoke } from "../../../../portfolios/tests/support/component-harness";
import { formHarness } from "./form-harness";
import { getEnvironmentDialogCopy } from "../../../../presentation/dialogs/environment/copy";
import { getSuiteDialogCopy } from "../../../../presentation/dialogs/suite/copy";
import * as suiteSelection from "../../../../presentation/dialogs/suite/state/suite-selection";
import type { EnvironmentDialog } from "../../../../presentation/dialogs/environment/EnvironmentDialog";
import type { SuiteDialog } from "../../../../presentation/dialogs/suite/SuiteDialog";

const event = { preventDefault() {} };
test("environment create/edit protects changed fields, keeps failed writes, releases successful saves", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let closes = 0, works = false;
  const { EnvironmentDialog: View } = f.load<{ EnvironmentDialog: typeof EnvironmentDialog }>(new URL("../../../../presentation/dialogs/environment/EnvironmentDialog.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("copy")) return { getEnvironmentDialogCopy };
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("createEnvironment")) return { createEnvironment: async () => { if (!works) throw new Error("offline"); return { id: "saved" }; } };
    return undefined;
  });
  const render = () => f.render(() => View({ projectId: "p", offline: false, onClose: () => { closes++; },
    onCreated: () => { assert.equal(f.released(), 1); closes++; }, onUpdated() {} }));
  render(); assert.equal(f.session()?.dirty, false);
  invoke(render().find(node => node.type === "input" && node.props.placeholder === getEnvironmentDialogCopy("en").namePlaceholder)!, "onChange", { target: { value: "Staging" } });
  render(); assert.equal(f.session()?.dirty, true);
  await invoke(render().find(node => node.type === "Modal")!, "onClose"); assert.equal(closes, 0);
  await invoke(render().find(node => node.type === "form")!, "onSubmit", event); render();
  assert.equal(f.session()?.dirty, true); assert.equal(f.session()?.busy, false);
  works = true; await invoke(render().find(node => node.type === "form")!, "onSubmit", event); assert.equal(closes, 1);
});

test("suite selection counts as unsaved work and cancel waits for confirmation", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let closes = 0;
  const { SuiteDialog: View } = f.load<{ SuiteDialog: typeof SuiteDialog }>(new URL("../../../../presentation/dialogs/suite/SuiteDialog.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("copy")) return { getSuiteDialogCopy };
    if (name.endsWith("suite-selection")) return suiteSelection;
    if (name.endsWith("useSuitePreview")) return { useSuitePreview: () => ({ cases: [], loading: false, error: false }) };
    return undefined;
  });
  const render = () => f.render(() => View({ projectId: "p", projectName: "Payments", cases: [], folders: [], offline: false,
    onClose: () => { closes++; }, onSaved() {} }));
  render(); assert.equal(f.session()?.dirty, false);
  invoke(render().find(node => node.type === "SuiteCasePicker")!, "onToggle", "case-a");
  render(); assert.equal(f.session()?.dirty, true);
  const cancel = () => render().find(node => node.type === "button" && node.props.children === "Cancel")!;
  await invoke(cancel(), "onClick"); assert.equal(closes, 0);
  f.approve(); await invoke(cancel(), "onClick"); assert.equal(closes, 1);
});

test("project dialog treats defaults as clean and releases before successful save", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let closes = 0, saved = false;
  const form = { name: "Payments", key: "PAY", description: "", portfolioId: null, responsibleIdentityId: null,
    pending: false, modified: false, save: async () => saved ? { data: { id: "p" }, etag: "v2" } : null };
  const { ProjectDialog: View } = f.load<{ ProjectDialog: (props: Record<string, unknown>) => unknown }>(new URL("../../../../presentation/dialogs/project/ProjectDialog.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useProjectForm")) return { useProjectForm: () => form };
    if (name.endsWith("useProjectPortfolioOptions")) return { useProjectPortfolioOptions: () => ({ items: [] }) };
    if (name.endsWith("copy")) return { getProjectDialogCopy: () => ({}), portfolioCopy: () => ({}) };
    return undefined;
  });
  const render = () => f.render(() => View({ workspaceId: "w", project: { id: "p", key: "PAY" }, offline: false,
    onClose: () => { closes++; }, onUpdated: () => { assert.equal(f.released(), 1); closes++; } }));
  render(); assert.equal(f.session()?.dirty, false);
  form.description = "Investigate retries"; render(); assert.equal(f.session()?.dirty, true);
  await invoke(render().find(node => node.type === "Modal")!, "onClose"); assert.equal(closes, 0);
  await invoke(render().find(node => node.type === "form")!, "onSubmit", event); assert.equal(f.released(), 0);
  saved = true; await invoke(render().find(node => node.type === "form")!, "onSubmit", event); assert.equal(closes, 1);
});

test("new run protects case selection, metadata, and file-only changes before closing the drawer", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let closed = 0, saved = false;
  const state = { projectIds: ["p"], caseIds: ["preset"], suiteId: "", iterations: [], iterationId: "", name: "", description: "", tags: "",
    ownerIdentityId: null, build: "", visibleCases: [], catalog: {}, loading: false, busy: false,
    platformBuilds: { drafts: {} as Record<string, unknown>, uploading: false }, submit: async () => saved ? { runs: [{ id: "r" }] } : null };
  const { RunDialog: View } = f.load<{ RunDialog: (props: Record<string, unknown>) => unknown }>(new URL("../../../../presentation/dialogs/run/RunDialog.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useBatchComposer")) return { useBatchComposer: () => state };
    if (name.endsWith("useDrawerDismiss")) return { useDrawerDismiss: () => ({ panelRef: { current: null }, dismiss: (action: () => void) => action() }) };
    if (name.endsWith("SelectionControls")) return { SelectionControls: "SelectionControls", useSelectionFilters: () => ({ visible: [] }) };
    return undefined;
  });
  const render = () => f.render(() => View({ data: { workspace: { id: "w" }, suites: [], projects: [] }, project: { id: "p" },
    presetCaseIds: ["preset"], selectedSuiteId: "", offline: false, onClose: () => { closed++; },
    onCreated: () => { assert.equal(f.released(), 1); closed++; } }));
  render(); assert.equal(f.session()?.dirty, false, "a preset case is not a user edit");
  state.platformBuilds.drafts = { p: { androidVersion: "", iosReference: "", file: { name: "build.apk", size: 10 }, artifact: null } };
  render(); assert.equal(f.session()?.dirty, true);
  await invoke(render().find(node => node.type === "Modal")!, "onClose"); assert.equal(closed, 0);
  state.platformBuilds.drafts = { p: { androidVersion: "", iosReference: "", file: null, artifact: null } };
  render(); assert.equal(f.session()?.dirty, false, "removing a build restores a clean form");
  state.name = "Release"; render(); assert.equal(f.session()?.dirty, true);
  await invoke(render().find(node => node.type === "form")!, "onSubmit", event); assert.equal(f.released(), 0);
  saved = true; await invoke(render().find(node => node.type === "form")!, "onSubmit", event); assert.equal(closed, 1);
});
