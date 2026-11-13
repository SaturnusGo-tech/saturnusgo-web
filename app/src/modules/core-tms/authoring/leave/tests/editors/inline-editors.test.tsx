import assert from "node:assert/strict";
import test from "node:test";
import { invoke } from "../../../../portfolios/tests/support/component-harness";
import { formHarness } from "../forms/form-harness";
import { getEnvironmentDialogCopy } from "../../../../presentation/dialogs/environment/copy";
import { profileCopy } from "../../../../profile/self/presentation/copy/profile-copy";

const event = { preventDefault() {} };
const tick = () => new Promise(resolve => setImmediate(resolve));
test("fresh environment hydration becomes the baseline, failed save keeps edits protected", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let closes = 0, success = false;
  const environment = { id: "env", projectId: "p", name: "Cached", key: "STG", baseUrl: "https://old.test", description: "" };
  const http = {};
  const { EnvironmentEditor: View } = f.load<{ EnvironmentEditor: (props: Record<string, unknown>) => unknown }>(new URL("../../../../presentation/config/environments/editor/EnvironmentEditor.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("copy")) return { getEnvironmentDialogCopy };
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
    if (name.endsWith("readEnvironmentForEdit")) return { readEnvironmentForEdit: async () => ({ data: { ...environment, name: "Fresh" }, etag: "v2" }) };
    if (name.endsWith("createEnvironment")) return { updateEnvironment: async () => { if (!success) throw Error("offline"); return { data: environment }; } };
    return undefined;
  });
  const render = () => f.render(() => View({ projectId: "p", environment, offline: false,
    onClose: () => { closes++; }, onBusy() {}, onSaved: () => { closes++; } }));
  render(); await tick(); render(); assert.equal(f.session()?.dirty, false);
  invoke(render().find(node => node.type === "input" && node.props["aria-label"] === "Name")!, "onChange", { target: { value: "Edited" } });
  render(); assert.equal(f.session()?.dirty, true);
  await invoke(render().find(node => node.type === "button" && node.props.children === "Cancel")!, "onClick"); assert.equal(closes, 0);
  await invoke(render().find(node => node.type === "form")!, "onSubmit", event); render(); assert.equal(f.session()?.dirty, true);
  success = true; await invoke(render().find(node => node.type === "form")!, "onSubmit", event); assert.equal(closes, 1);
});

test("profile identity/contact edits register, revert clears, cancel is guarded, failure retains protection", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let closes = 0, success = false;
  const { ProfileEditor: View } = f.load<{ ProfileEditor: (props: Record<string, unknown>) => unknown }>(new URL("../../../../profile/self/presentation/editor/ProfileEditor.tsx", import.meta.url), name => {
    if (name.endsWith("profile-copy")) return { profileCopy };
    return undefined;
  });
  const render = () => f.render(() => View({ profile: { id: "qa", name: "Pat", phone: "", introduction: "", contactUrl: "" }, pending: false, ru: false,
    onCancel: () => { closes++; }, onSave: async () => success }));
  render(); assert.equal(f.session()?.dirty, false);
  const nameInput = () => render().find(node => node.type === "input" && node.props.autoComplete === "name")!;
  invoke(nameInput(), "onChange", { target: { value: "New name" } }); render(); assert.equal(f.session()?.dirty, true);
  invoke(nameInput(), "onChange", { target: { value: "Pat" } }); render(); assert.equal(f.session()?.dirty, false);
  invoke(nameInput(), "onChange", { target: { value: "New name" } }); render();
  await invoke(render().find(node => node.type === "button" && node.props.children === "Cancel")!, "onClick"); assert.equal(closes, 0);
  await invoke(render().find(node => node.type === "form")!, "onSubmit", event); await tick(); render(); assert.equal(f.session()?.dirty, true);
  success = true; await invoke(render().find(node => node.type === "form")!, "onSubmit", event); await tick(); render(); assert.equal(f.session()?.dirty, false);
});

test("run edit registers existing dirty/uncertain state and releases before save callback", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let closes = 0, success = false;
  const state = { draft: { name: "Run", ownerIdentityId: null }, draftDirty: false, uncertain: false, busy: false,
    phase: "ready", editable: true, conflict: false, platformBuilds: { uploading: false }, save: async () => success ? { id: "r" } : null };
  const { RunEditDialog: View } = f.load<{ RunEditDialog: (props: Record<string, unknown>) => unknown }>(new URL("../../../../runs/edit/presentation/RunEditDialog.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useRunEditor")) return { useRunEditor: () => state };
    if (name.endsWith("useMemberName")) return { useMemberName: () => ({ name: "Pat" }) };
    if (name.endsWith("useDrawerDismiss")) return { useDrawerDismiss: () => ({ closing: false, panelRef: { current: null }, dismiss: (action: () => void) => action() }) };
    return undefined;
  });
  const render = () => f.render(() => View({ run: { id: "r", projectId: "p" }, workspaceId: "w", onClose: () => { closes++; },
    onSaved: () => { assert.equal(f.released(), 1); closes++; } }));
  render(); assert.equal(f.session()?.dirty, false);
  state.uncertain = true; render(); assert.equal(f.session()?.dirty, true);
  const firstRevision = f.session()?.revision;
  state.draft.name = "Later edit"; render(); assert.notEqual(f.session()?.revision, firstRevision);
  await invoke(render().find(node => node.type === "Drawer")!, "onClose"); assert.equal(closes, 0);
  await invoke(render().find(node => node.type === "form")!, "onSubmit", event); assert.equal(f.released(), 0);
  success = true; await invoke(render().find(node => node.type === "form")!, "onSubmit", event); assert.equal(closes, 1);
});

test("step actual result keeps global protection during typing and save retry, clears after success", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let success = false;
  let finish: (value: boolean) => void = () => {};
  const { StepActualEditor: View } = f.load<{ StepActualEditor: (props: Record<string, unknown>) => unknown }>(new URL("../../../../presentation/runs/actual/StepActualEditor.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    return undefined;
  });
  const render = () => f.render(() => View({ value: "Original", order: 1, onChange() {}, onDirtyChange() {},
    onSave: async () => { if (success) return true; return new Promise<boolean>(resolve => { finish = resolve; }); } }));
  render(); assert.equal(f.session()?.dirty, false);
  invoke(render().find(node => node.type === "textarea")!, "onChange", { target: { value: "Observed mismatch" } });
  render(); assert.equal(f.session()?.dirty, true);
  const firstRevision = f.session()?.revision;
  invoke(render().find(node => node.type === "textarea")!, "onChange", { target: { value: "More observed details" } }); render();
  assert.notEqual(f.session()?.revision, firstRevision);
  invoke(render().find(node => node.type === "textarea")!, "onBlur"); render(); assert.equal(f.session()?.busy, true);
  finish(false); await tick(); render(); assert.equal(f.session()?.dirty, true); assert.equal(f.session()?.busy, false);
  success = true; invoke(render().find(node => node.type === "textarea")!, "onBlur"); await tick(); render(); assert.equal(f.session()?.dirty, false);
  invoke(render().find(node => node.type === "textarea")!, "onChange", { target: { value: "Next observation" } }); render(); assert.equal(f.session()?.dirty, true);
});
