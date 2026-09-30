import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import type { Project } from "../../../../../../core/tms/contracts/legacy-contract";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation } from "../../../../../../core/tms/idempotency/pending-operation";
import { createProject, updateProject } from "../../../../application/projects/createProject";
import { portfolioCopy } from "../../../../portfolios/model/copy";
import { componentHarness, invoke, nodes, type Node } from "../../../../portfolios/tests/support/component-harness";
import type { useProjectForm } from "../../../../projects/state/dialog/useProjectForm";
import { getProjectDialogCopy } from "../../../dialogs/project/copy";
import type { ProjectInlineEditor } from "../ProjectInlineEditor";

const project: Project = { id: "project", key: "PAY", name: "Payments", description: "Existing description", status: "active",
  portfolioId: "portfolio", responsibleIdentityId: "member", testingPlan: "Acceptance plan", workflowPhase: "new", checklist: [] };
type Http = Parameters<typeof updateProject>[0]["http"];
type Write = Parameters<Http["mutateResource"]>;
const response = (name = "Updated name") => ({ data: { ...project, name }, etag: '"project:2"' });
const formNode = (tree: Node[]) => tree.find(node => node.type === "form")!;
const nameNode = (tree: Node[]) => tree.find(node => node.props["data-testid"] === "project-name")!;
const saveNode = (tree: Node[]) => tree.find(node => node.type === "button" && node.props.type !== "button")!;

function setup(t: TestContext, overrides: { etag?: string | null; offline?: boolean } = {}) {
  const h = componentHarness(); t.after(() => h.dispose());
  const requests: { path: string; method: Write[1]; body: unknown; options: Write[3] }[] = [];
  const saved: { project: Project; etag: string | null }[] = [], busy: boolean[] = [];
  let cancelled = 0;
  let respond = async () => response();
  const unused = async (): Promise<never> => { throw new Error("Unexpected read or unversioned write"); };
  const http: Http = { get: unused, getResource: unused, mutate: unused,
    async mutateResource<T>(path: string, method: Write[1], body?: unknown, options?: Write[3]) {
      requests.push({ path, method, body, options });
      const result = await respond(); return { data: result.data as T, etag: result.etag };
    } };
  const form = h.load<{ useProjectForm: typeof useProjectForm }>(new URL("../../../../projects/state/dialog/useProjectForm.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
    if (name.endsWith("pending-operation")) return { resolvePendingOperation };
    if (name.endsWith("mutation-failure")) return { formatTmsMutationFailure, toTmsMutationFailure };
    if (name.endsWith("createProject")) return { createProject, updateProject };
  });
  const { ProjectInlineEditor: Editor } = h.load<{ ProjectInlineEditor: typeof ProjectInlineEditor }>(new URL("../ProjectInlineEditor.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("portfolios/model/copy")) return { portfolioCopy };
    if (name.endsWith("project/copy")) return { getProjectDialogCopy };
    if (name.endsWith("useProjectForm")) return form;
    if (name.endsWith("useProjectPortfolioOptions")) return { useProjectPortfolioOptions: () => ({ items: [] }) };
  });
  const props = { project, workspaceId: "workspace", etag: '"project:1"', offline: false, ...overrides,
    onBusy: (value: boolean) => busy.push(value), onCancel: () => { cancelled++; },
    onSaved: (value: Project, etag: string | null) => saved.push({ project: value, etag }) };
  const render = () => nodes(h.render(() => Editor(props)));
  return { render, requests, saved, busy, cancelled: () => cancelled,
    respond: (next: typeof respond) => { respond = next; },
    rename: (name: string) => { invoke(nameNode(render()), "onChange", { target: { value: name } }); return render(); },
    submit: (tree = render()) => invoke(formNode(tree), "onSubmit", { preventDefault() {} }) as Promise<void> };
}

for (const [reason, props, nextName] of [
  ["missing ETag", { etag: null }, "Updated name"],
  ["offline", { offline: true }, "Updated name"],
  ["blank name", {}, "   "],
  ["unchanged fields", {}, "Payments"],
] as const) test(`inline editor rejects saving with ${reason}`, async t => {
  const s = setup(t, props), tree = s.rename(nextName);
  assert.equal(saveNode(tree).props.disabled, true);
  await s.submit(tree);
  assert.equal(s.requests.length, 0); assert.equal(s.saved.length, 0); assert.equal(s.cancelled(), 0);
});

test("saving inline sends the edited metadata with the ETag and retains unexposed project fields", async t => {
  const s = setup(t); let tree = s.rename(" Updated name ");
  invoke(tree.find(node => node.type === "textarea")!, "onChange", { target: { value: " New description " } });
  invoke(tree.find(node => node.type === "AnimatedSelect")!, "onChange", "");
  invoke(tree.find(node => node.type === "ResponsiblePicker")!, "onChange", null);
  tree = s.render(); assert.equal(saveNode(tree).props.disabled, false); await s.submit(tree);
  assert.equal(s.requests.length, 1); assert.equal(s.requests[0].method, "PATCH");
  assert.equal(s.requests[0].path, "/projects/project");
  assert.equal(s.requests[0].options?.ifMatch, '"project:1"');
  assert.deepEqual(s.requests[0].body, { name: "Updated name", description: "New description",
    portfolioId: null, responsibleIdentityId: null, testingPlan: "Acceptance plan", workflowPhase: "new", checklist: [] });
  assert.equal(s.saved.length, 1); assert.equal(s.saved[0].project.name, "Updated name");
  assert.equal(s.saved[0].etag, '"project:2"'); assert.equal(s.cancelled(), 0);
});

test("a pending save disables fields and dismissal and cannot be submitted twice", async t => {
  const s = setup(t); let complete!: (value: ReturnType<typeof response>) => void;
  s.respond(() => new Promise(resolve => { complete = resolve; }));
  const submission = s.submit(s.rename("Updated name")), tree = s.render();
  assert.equal(formNode(tree).props["aria-busy"], true); assert.equal(s.busy[s.busy.length - 1], true);
  for (const node of tree.filter(node => ["input", "textarea", "AnimatedSelect", "ResponsiblePicker", "button"].includes(node.type))) {
    assert.equal(node.props.disabled, true, `${node.type} stays disabled during the write`);
  }
  invoke(formNode(tree), "onKeyDown", { key: "Escape", preventDefault() {}, stopPropagation() {} });
  await s.submit(tree); assert.equal(s.requests.length, 1); assert.equal(s.cancelled(), 0);
  complete(response()); await submission;
  s.render(); assert.equal(s.busy[s.busy.length - 1], false); assert.equal(s.saved.length, 1);
});

test("failed save preserves the open draft and retry keeps the same operation key", async t => {
  const s = setup(t);
  s.respond(async () => { throw new Error("The server cannot be reached"); });
  await s.submit(s.rename("Retry this draft"));
  let tree = s.render();
  assert.equal(nameNode(tree).props.value, "Retry this draft");
  assert.equal(tree.some(node => node.props.role === "alert"), true);
  assert.equal(saveNode(tree).props.disabled, false); assert.equal(s.saved.length, 0); assert.equal(s.cancelled(), 0);
  s.respond(async () => response("Retry this draft")); await s.submit(tree); tree = s.render();
  assert.equal(s.requests.length, 2);
  assert.ok(s.requests[0].options?.idempotencyKey);
  assert.equal(s.requests[0].options?.idempotencyKey, s.requests[1].options?.idempotencyKey);
  assert.equal(s.saved[0].project.name, "Retry this draft");
  assert.equal(tree.some(node => node.props.role === "alert"), false);
});

test("Escape dismisses an idle inline draft without saving", t => {
  const s = setup(t), tree = s.rename("Discard this draft");
  invoke(formNode(tree), "onKeyDown", { key: "Escape", preventDefault() {}, stopPropagation() {} });
  assert.equal(s.cancelled(), 1); assert.equal(s.requests.length, 0);
});
