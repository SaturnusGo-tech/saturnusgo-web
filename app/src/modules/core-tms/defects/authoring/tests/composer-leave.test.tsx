import test from "node:test";
import assert from "node:assert/strict";
import { componentHarness, invoke, type Node } from "../../../portfolios/tests/support/component-harness";
import type { DefectDialog } from "../../../presentation/dialogs/defect/DefectDialog";
import type { InlineDefectComposer } from "../../../presentation/runs/defect/InlineDefectComposer";
import { getDefectDialogCopy } from "../../../presentation/dialogs/defect/copy";
import * as routing from "../../model/integration-target";
import { defectRouteChoices } from "../../presentation/defect-route-choices";
import type { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";

function fixture(inline: boolean) {
  const h = componentHarness();
  let session: { dirty: boolean; busy?: boolean; revision?: string } | undefined;
  let approve = false, closes = 0, releases = 0, fail = true;
  const { useFormLeave: useLeave } = h.load<{ useFormLeave: typeof useFormLeave }>(new URL("../../../authoring/leave/state/value/useFormLeave.ts", import.meta.url), name => {
    if (name.endsWith("useAuthoringSession")) return { useAuthoringSession: (next: typeof session) => { session = next; return { release: () => { releases++; } }; } };
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: async (action: () => void) => {
      if (session?.busy || (session?.dirty && !approve)) return false;
      action(); return true;
    } };
    return undefined;
  });
  const resolve = (name: string) => {
    if (name.endsWith("useFormLeave")) return { useFormLeave: useLeave };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("copy")) return { getDefectDialogCopy };
    if (name.endsWith("useDrawerDismiss")) return { useDrawerDismiss: () => ({ closing: false, panelRef: {}, dismiss: (done: () => void) => done() }) };
    if (name.endsWith("use-youtrack-route-options")) return { useYouTrackRouteOptions: () => ({ configurationVersion: 2, enabled: false, options: [], status: "ready" }) };
    if (name.endsWith("integration-target")) return routing;
    if (name.endsWith("defect-route-choices")) return { defectRouteChoices };
    if (name.endsWith("labels")) return { localizedComponentLabel: (_locale: string, value: string) => value };
    if (name.endsWith("caseRevision")) return { executableSteps: () => [{ id: "step", action: "Open", expectedResult: "Expected" }] };
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("AttachmentClientProvider")) return { useAttachmentClient: () => ({}) };
    if (name.endsWith("describeDefectCreateError")) return { describeDefectCreateError: () => "Retry" };
    if (name.endsWith("createDefect")) return { createDefect: async () => { if (fail) throw new Error("network"); return { id: "saved" }; } };
    return undefined;
  };
  const entry = inline ? "../../../presentation/runs/defect/InlineDefectComposer.tsx" : "../../../presentation/dialogs/defect/DefectDialog.tsx";
  const module = h.load<{ InlineDefectComposer: typeof InlineDefectComposer; DefectDialog: typeof DefectDialog }>(new URL(entry, import.meta.url), resolve);
  const item = { id: "item", caseKey: "TC-1", activeAttemptNo: 1, snapshot: { title: "Prefilled", component: "Orders", tags: [] },
    attempts: [{ attemptNo: 1, actualResult: "Observed", stepResults: [{ stepId: "step", status: "failed" }] }] };
  const props = { workspaceId: "w", projectId: "p", run: inline ? { id: "run", environment: { name: "QA", baseUrl: "" } } : null,
    item: inline ? item : null, step: { id: "step", order: 1, action: "Open" }, components: ["Orders"], offline: false,
    onClose: () => { closes++; }, onCreated: () => { assert.ok(releases > 0, "release before completion"); closes++; } };
  const View = inline ? module.InlineDefectComposer : module.DefectDialog;
  return { h, render: () => h.render(() => View(props as never)) as unknown as Node,
    session: () => session, closes: () => closes, releases: () => releases,
    approve: () => { approve = true; }, saveWorks: () => { fail = false; } };
}

for (const inline of [false, true]) {
  test(`${inline ? "run" : "manual"} defect: pristine prefill, modified/reverted fields and attachment-only close`, async t => {
    const f = fixture(inline); t.after(() => f.h.dispose());
    const initial = f.render().props.value as Record<string, unknown>;
    assert.equal(f.session()?.dirty, false);
    invoke(f.render(), "onChange", { title: "Changed" }); f.render();
    assert.equal(f.session()?.dirty, true);
    await invoke(f.render(), "onClose"); assert.equal(f.closes(), 0);
    invoke(f.render(), "onChange", { title: initial.title }); f.render(); assert.equal(f.session()?.dirty, false);
    invoke(f.render(), "onFilesChange", [{ name: "proof.mov", size: 100 }]); f.render();
    assert.equal(f.session()?.dirty, true);
    const fileRevision = f.session()?.revision;
    invoke(f.render(), "onFilesChange", [{ name: "second.mov", size: 200 }]); f.render();
    assert.notEqual(f.session()?.revision, fileRevision, "replacing an unsaved attachment needs a fresh approval");
    const previousRoute = f.session()?.revision;
    (f.render().props.routing as { onChange: (next: string) => void }).onChange("disabled"); f.render();
    assert.notEqual(f.session()?.revision, previousRoute, "changing only integration routing needs a fresh approval"); f.approve(); await invoke(f.render(), "onClose"); assert.equal(f.closes(), 1);
  });
  test(`${inline ? "run" : "manual"} defect: failed save retains protection and successful save releases first`, async t => {
    const f = fixture(inline); t.after(() => f.h.dispose()); f.render();
    invoke(f.render(), "onChange", { title: "Failure", description: "Details" });
    await invoke(f.render(), "onSubmit", { preventDefault() {} }); f.render();
    assert.equal(f.session()?.dirty, true); assert.equal(f.releases(), 0);
    await invoke(f.render(), "onClose"); assert.equal(f.closes(), 0);
    f.saveWorks(); await invoke(f.render(), "onSubmit", { preventDefault() {} });
    assert.equal(f.releases(), 1); assert.ok(f.closes() >= 1);
  });
}

test("manual folder and shared scenario choices participate in unsaved protection", async t => {
  const f = fixture(false); t.after(() => f.h.dispose()); f.render();
  invoke(f.render(), "onChange", { sourceFolderId: "folder" }); f.render();
  assert.equal(f.session()?.dirty, true);
  await invoke(f.render(), "onClose"); assert.equal(f.closes(), 0);
  invoke(f.render(), "onChange", { reproductionSharedSteps: [{ sharedStepId: "shared", revision: 3 }] }); f.render();
  const previous = f.session()?.revision;
  invoke(f.render(), "onChange", { reproductionSharedSteps: [{ sharedStepId: "shared", revision: 4 }] }); f.render();
  assert.notEqual(f.session()?.revision, previous);
  f.approve(); await invoke(f.render(), "onClose"); assert.equal(f.closes(), 1);
});
