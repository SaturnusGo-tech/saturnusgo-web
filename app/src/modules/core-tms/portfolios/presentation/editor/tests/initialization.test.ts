import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../tests/support/component-harness";
import { portfolioCopy } from "../../../model/copy";
import { organizationCopy } from "../../../management/model/copy";
import { validChecklist } from "../../../management/model/organization";
import { resolvePendingOperation } from "../../../../../../core/tms/idempotency/pending-operation";
import type { Project } from "../../../../../../core/tms/contracts/legacy-contract";
import type { useProjectForm } from "../../../../projects/state/dialog/useProjectForm";
import type { ProjectEditorPage } from "../ProjectEditorPage";
const copy = portfolioCopy("ru");
for (const [editing, omitsChecklist] of [[false, false], [true, false], [false, true]]) test(`${omitsChecklist ? "legacy form with omitted checklist" : editing ? "legacy project edit" : "creation from existing portfolio"} renders and saves through real form initialization without a checklist field`, async () => {
  const h = componentHarness(); const commands: Record<string, unknown>[] = []; const events: string[] = [];
  const legacy: Project = { id: "project", key: "PAY", name: "Payments", description: "", portfolioId: "portfolio-existing" };
  const form = h.load<{ useProjectForm: typeof useProjectForm }>(new URL("../../../../projects/state/dialog/useProjectForm.ts", import.meta.url), (name) => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("pending-operation")) return { resolvePendingOperation };
    if (name.endsWith("createProject")) return {
      createProject: async (input: Record<string, unknown>) => { commands.push(input); return { ok: true, project: legacy, etag: '"v2"' }; },
      updateProject: async (input: Record<string, unknown>) => { commands.push(input); return { data: legacy, etag: '"v2"' }; },
    };
  });
  const view = h.load<{ ProjectEditorPage: typeof ProjectEditorPage }>(new URL("../ProjectEditorPage.tsx", import.meta.url), (name) => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru" }) };
    if (name.endsWith("useProjectForm")) return { useProjectForm: (input: Parameters<typeof useProjectForm>[0]) => {
      const value = form.useProjectForm(input); return omitsChecklist ? { ...value, checklist: undefined } : value;
    } };
    if (name.endsWith("useProjectPortfolioOptions")) return { useProjectPortfolioOptions: () => ({ items: [{ id: "portfolio-existing", name: "Платёжные продукты" }] }) };
    if (name.endsWith("project/copy")) return { getProjectDialogCopy: () => ({}) };
    if (name.endsWith("management/model/copy")) return { organizationCopy };
    if (name.endsWith("management/model/organization")) return { validChecklist };
  });
  const props = { workspaceId: "workspace", copy, portfolioId: "portfolio-existing", current: editing ? legacy : undefined, etag: editing ? '"v1"' : undefined,
    onCreated: () => events.push("created"), onUpdated: () => events.push("updated"), onCancel() {} };
  const render = () => nodes(h.render(() => view.ProjectEditorPage(props)));
  let all = render(); assert.equal(all[0].type, "form");
  assert.equal(all.find((node) => node.type === "AnimatedSelect")?.props.value, "portfolio-existing");
  assert.deepEqual(Array.from(all.find((node) => node.type === "OrganizationExtras")!.props.items as unknown[]), []);
  assert.equal(all.find((node) => node.type === "WorkflowSelect")?.props.value, "new");
  invoke(all.find((node) => node.props.id === "project-title")!, "onChange", { target: { value: editing ? "Payments updated" : "Payments" } });
  all = render(); await invoke(all[0], "onSubmit", { preventDefault() {} });
  assert.equal(commands.length, 1); assert.equal(commands[0].portfolioId, "portfolio-existing");
  assert.deepEqual(Array.from(commands[0].checklist as unknown[]), []); assert.equal(commands[0].workflowPhase, "new");
  assert.deepEqual(events, [editing ? "updated" : "created"]); h.dispose();
});
