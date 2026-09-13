import test from "node:test";
import assert from "node:assert/strict";
import { componentHarness, invoke, type Node } from "../../../../../portfolios/tests/support/component-harness";
import type { InlineDefectComposer } from "../../../../runs/defect/InlineDefectComposer";
import type { DefectDialog } from "../../../defect/DefectDialog";
import { getDefectDialogCopy } from "../../../defect/copy";
import * as routing from "../../../../../defects/model/integration-target";
import { defectRouteChoices } from "../../../../../defects/presentation/defect-route-choices";
import type { createDefect } from "../../../../../application/defects/createDefect";

test("both entry points save edited Markdown, fields and attachments, preserve context, and retry the same operation", async () => {
  for (const inline of [false, true]) {
    const h = componentHarness(); const calls: Parameters<typeof createDefect>[0][] = [];
    let fail = true, created = 0;
    const resolve = (name: string) => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru", t: (key: string) => key }) };
      if (name.endsWith("copy")) return { getDefectDialogCopy };
      if (name.endsWith("useDrawerDismiss")) return { useDrawerDismiss: () => ({ closing: false, panelRef: {}, dismiss: (done: () => void) => done() }) };
      if (name.endsWith("use-youtrack-route-options")) return { useYouTrackRouteOptions: () => ({ configurationVersion: 2, enabled: false, options: [], status: "ready" }) };
      if (name.endsWith("integration-target")) return routing;
      if (name.endsWith("defect-route-choices")) return { defectRouteChoices };
      if (name.endsWith("labels")) return { localizedComponentLabel: (_locale: string, value: string) => value };
      if (name.endsWith("caseRevision")) return { executableSteps: () => [{ id: "step", action: "Open", expectedResult: "Old expected" }] };
      if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
      if (name.endsWith("AttachmentClientProvider")) return { useAttachmentClient: () => ({}) };
      if (name.endsWith("describeDefectCreateError")) return { describeDefectCreateError: () => "Retry" };
      if (name.endsWith("createDefect")) return { createDefect: async (args: Parameters<typeof createDefect>[0]) => {
        calls.push(args); if (fail) throw new Error("network"); return { id: "saved" };
      } };
      return undefined;
    };
    const entry = inline ? "../../../../runs/defect/InlineDefectComposer.tsx" : "../../../defect/DefectDialog.tsx";
    const module = h.load<{ InlineDefectComposer: typeof InlineDefectComposer; DefectDialog: typeof DefectDialog }>(new URL(entry, import.meta.url), resolve);
    const item = { id: "item", caseKey: "TC-1", activeAttemptNo: 1, snapshot: { title: "Case", component: "Orders", tags: [] },
      attempts: [{ attemptNo: 1, actualResult: "Old actual", stepResults: [{ stepId: "step", status: "failed" }] }] };
    const props = { workspaceId: "w", projectId: "p", run: inline ? { id: "run", environment: { name: "QA", baseUrl: "" } } : null,
      item: inline ? item : null, step: { id: "step", order: 1, action: "Open" }, components: ["Orders"], offline: false,
      onClose() {}, onCreated: () => { created++; } };
    const View = inline ? module.InlineDefectComposer : module.DefectDialog;
    const render = () => h.render(() => View(props as never)) as unknown as Node;
    const markdown = "## Actual\n\n**Empty** order history.\n\n- No rows\n- No message";
    const file = { name: "evidence.png", size: 100 };
    invoke(render(), "onChange", { title: "Missing orders", description: "After login", actualResult: markdown,
      expectedResult: "# Expected\n\nOrder list", reproduction: "1. Log in", severity: "critical", priority: "medium",
      reproducibility: "Sometimes", component: "Payments", assigneeIdentityId: "qa-anna", link: "app://orders" });
    invoke(render(), "onFilesChange", [file]);
    await invoke(render(), "onSubmit", { preventDefault() {} });
    assert.equal(render().props.error, "Retry"); assert.equal(created, 0);
    assert.equal((render().props.value as { actualResult: string }).actualResult, markdown);
    fail = false; await invoke(render(), "onSubmit", { preventDefault() {} });
    assert.equal(created, 1); assert.equal(calls[0].operationKey, calls[1].operationKey);
    const saved = calls[1]; assert.equal(saved.payload.actualResult, markdown);
    assert.equal(saved.payload.expectedResult, "# Expected\n\nOrder list");
    assert.equal(saved.payload.runId, inline ? "run" : null); assert.equal(saved.payload.stepId, inline ? "step" : null);
    assert.equal(saved.payload.runItemId, inline ? "item" : null); assert.equal(saved.payload.priority, "medium");
    assert.equal(saved.payload.severity, "critical"); assert.equal(saved.payload.reproducibility, "Sometimes");
    assert.equal(saved.payload.assigneeIdentityId, "qa-anna"); assert.equal(saved.payload.component, "Payments");
    assert.equal(saved.link, "app://orders"); assert.equal(saved.files[0], file);
    if (inline) assert.ok(saved.payload.description.includes("1. Log in"));
    h.dispose();
  }
});
