import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../tests/support/component-harness";
import { portfolioCopy } from "../../../model/copy";
import type { ProjectEditorPage } from "../ProjectEditorPage";
import type { PortfolioEditorPage } from "../PortfolioEditorPage";

import { organizationCopy } from "../../../management/model/copy";
import { validChecklist } from "../../../management/model/organization";
import { organizationErrors, focusOrganizationError } from "../validation/validate";
const copy = portfolioCopy("ru");
function shared(name: string) {
  if (name.endsWith("validation/validate")) return { organizationErrors, focusOrganizationError };
  if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru" }) };
  if (name.endsWith("management/model/copy")) return { organizationCopy };
  if (name.endsWith("management/model/organization")) return { validChecklist };
}

test("portfolio creation is a page form that submits the entered title and description", async () => {
  const h = componentHarness(); const saved: unknown[] = [];
  const { PortfolioEditorPage: Editor } = h.load<{ PortfolioEditorPage: typeof PortfolioEditorPage }>(new URL("../PortfolioEditorPage.tsx", import.meta.url), shared);
  const render = () => nodes(h.render(() => Editor({ workspaceId: "workspace", copy, pending: false, error: null,
    onSave: async (draft) => { saved.push(draft); }, onCancel() {} })));
  let all = render();
  assert.equal(all[0].type, "form");
  assert.equal(all.some((node) => node.type === "Modal"), false);
  assert.equal(all.find((node) => node.type === "input")?.props.required, true);
  invoke(all.find((node) => node.props.id === "portfolio-title")!, "onChange", { target: { value: "Платежи" } });
  invoke(all.find((node) => node.type === "OrganizationMarkdownField")!, "onChange", "Проверяем переводы");
  all = render();
  await invoke(all[0], "onSubmit", { preventDefault() {} });
  assert.deepEqual(JSON.parse(JSON.stringify(saved)), [{ name: "Платежи", description: "Проверяем переводы", responsibleIdentityId: null, workflowPhase: "new", checklist: [] }]);
  assert.equal(all.some((node) => node.type === "aside"), true);
});

test("project page persists through the existing form owner and invokes only the resulting detail callback", async () => {
  const h = componentHarness(); const events: string[] = [];
  const created = { id: "new-project", workspaceId: "workspace", name: "Платежи", key: "PAY", status: "active" as const };
  const form = { name: created.name, key: created.key, description: "Описание", testingPlan: "Проверить оплату", portfolioId: null,
    workflowPhase: "new", checklist: [], setWorkflowPhase() {}, setChecklist() {}, responsibleIdentityId: null, pending: false, modified: true, error: "", updateName() {}, setKey() {}, setDescription() {},
    setTestingPlan() {}, setPortfolioId() {}, setResponsibleIdentityId() {}, save: async () => { events.push("save"); return { data: created, etag: "version" }; } };
  const { ProjectEditorPage: Editor } = h.load<{ ProjectEditorPage: typeof ProjectEditorPage }>(new URL("../ProjectEditorPage.tsx", import.meta.url), (name) => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru" }) };
    if (name.endsWith("useProjectForm")) return { useProjectForm: () => form };
    if (name.endsWith("useProjectPortfolioOptions")) return { useProjectPortfolioOptions: () => ({ items: [] }) };
    if (name.endsWith("project/copy")) return { getProjectDialogCopy: () => ({}) };
    return shared(name);
  });
  const props = { workspaceId: "workspace", copy, onCreated: () => events.push("detail"), onUpdated: () => events.push("updated"), onCancel() {} };
  let all = nodes(h.render(() => Editor(props)));
  assert.equal(all[0].type, "form"); assert.equal(all.filter((node) => node.type === "textarea").length, 0);
  assert.equal(all.filter((node) => node.type === "OrganizationMarkdownField").length, 2);
  assert.equal(all.filter((node) => node.type === "OrganizationMarkdownField").every((node) => !node.props.editing), true);
  invoke(all.find((node) => node.type === "OrganizationMarkdownField")!, "onEdit");
  all = nodes(h.render(() => Editor(props)));
  assert.equal(all.filter((node) => node.type === "OrganizationMarkdownField" && node.props.editing).length, 1);
  assert.equal(all.find((node) => node.props.id === "project-title")?.props["data-field"], "name");
  assert.equal(all.some((node) => node.type === "Modal"), false);
  await invoke(all[0], "onSubmit", { preventDefault() {} });
  assert.deepEqual(events, ["save", "detail"]);
  all = nodes(h.render(() => Editor({ ...props, current: created })));
  assert.equal(all.find((node) => node.type === "input" && node.props.pattern)?.props.disabled, true);
  await invoke(all[0], "onSubmit", { preventDefault() {} });
  assert.deepEqual(events, ["save", "detail", "save", "updated"]);
});


test("organization validation rejects missing and numeric keys and accepts localized names", () => {
  const valid = { name: "Платежи", key: "PAY2", description: "", checklist: [] };
  assert.deepEqual(organizationErrors(valid, true), {});
  assert.ok(organizationErrors({ ...valid, key: "" }, true).key);
  assert.ok(organizationErrors({ ...valid, key: "2345" }, true).key);
  assert.ok(organizationErrors({ ...valid, name: "   " }, true).name);
  assert.ok(organizationErrors({ ...valid, testingPlan: "x".repeat(20001) }, true).plan);
});
