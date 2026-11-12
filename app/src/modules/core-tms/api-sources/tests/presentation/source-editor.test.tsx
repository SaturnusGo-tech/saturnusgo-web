import assert from "node:assert/strict";
import test from "node:test";
import type { SourceEditor } from "../../editor/SourceEditor";
import { keepsSourceCredentials, sourceDraft, type ApiSource } from "../../model/api-source";
import type { SourceCredentials } from "../../forms/SourceCredentials";
import type { SourceDisclosure } from "../../editor/disclosure/SourceDisclosure";
import type { SourceProjects } from "../../forms/SourceProjects";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
test("Swagger full-page form retains validation, pending gate and saved callback without a modal", () => {
  const h = componentHarness(); let saves = 0, cancels = 0;
  const state = { draft: sourceDraft(null, "p"), setDraft() {}, pending: false, error: null, save: () => saves++ };
  const { SourceEditor: View } = h.load<{ SourceEditor: typeof SourceEditor }>(new URL("../../editor/SourceEditor.tsx", import.meta.url), name => {
    if (name.endsWith("useApiSourceEditor")) return { useApiSourceEditor: () => state };
  });
  const props = { workspaceId: "w", projectId: "p", source: null, catalog: [], projects: [{ id: "p", name: "Project" }], ru: false, onClose: () => cancels++, onSaved() {}, onExisting() {}, onReload() {} };
  let all = nodes(h.render(() => View(props)));
  assert.equal(all[0].type, "form"); assert.equal(all.some(node => node.props.role === "dialog"), false);
  assert.equal(all.find(node => node.props.type === "url")?.props.isRequired, true);
  invoke(all[0], "onSubmit", { preventDefault() {} }); assert.equal(saves, 1);
  invoke(all.find(node => node.type === "IntegrationButton" && node.props.type === "button")!, "onPress"); assert.equal(cancels, 1);
  state.pending = true; all = nodes(h.render(() => View(props)));
  assert.equal(all.find(node => node.type === "fieldset")?.props.disabled, true);
  assert.equal(all.find(node => node.props.type === "submit")?.props.isDisabled, true);
});
test("specification authentication preserves masked credentials and clears incompatible secrets", () => {
  const h = componentHarness(); let draft = sourceDraft(null, "p");
  const { SourceCredentials: View } = h.load<{ SourceCredentials: typeof SourceCredentials }>(new URL("../../forms/SourceCredentials.tsx", import.meta.url), name => name.endsWith("api-source") ? { keepsSourceCredentials } : undefined);
  const render = () => nodes(h.render(() => View({ draft, source: null, ru: false, onChange: value => { draft = value; } })));
  let all = render(); assert.equal(all.find(node => node.type === "SourceDisclosure")?.props.defaultOpen, false);
  const selector = all.find(node => node.type === "IntegrationSelect")!; assert.ok(selector);
  draft.secrets = { username: "saved", password: "secret" };
  invoke(selector, "onValueChange", "bearer"); assert.equal(draft.authMode, "bearer"); assert.deepEqual(Object.keys(draft.secrets), []);
  all = render(); const token = all.find(node => node.type === "IntegrationInput" && node.props.type === "password")!;
  invoke(token, "onValueChange", "new-token"); assert.equal(draft.secrets.apiToken, "new-token");
  assert.equal(render().find(node => node.type === "SourceDisclosure")?.props.defaultOpen, true);
});
test("project controls retain scoped selection and all-projects replacement", () => {
  const h = componentHarness(); let draft = sourceDraft(null, "p");
  const { SourceProjects: View } = h.load<{ SourceProjects: typeof SourceProjects }>(new URL("../../forms/SourceProjects.tsx", import.meta.url));
  const render = () => nodes(h.render(() => View({ draft, projects: [{ id: "p", name: "Release" }, { id: "q", name: "Web" }], ru: false, onChange: value => { draft = value; } })));
  let all = render(); assert.deepEqual(Array.from(draft.projectIds), ["p"]);
  invoke(all.find(node => node.type === "IntegrationCheckbox" && node.props.children === "Web")!, "onValueChange", true);
  assert.deepEqual(Array.from(draft.projectIds), ["p", "q"]);
  all = render(); invoke(all.find(node => node.type === "IntegrationCheckbox" && node.props.children === "Release")!, "onValueChange", false);
  assert.deepEqual(Array.from(draft.projectIds), ["q"]);
  invoke(render().find(node => node.type === "IntegrationCheckbox" && node.props.children === "All workspace projects")!, "onValueChange", true);
  assert.equal(draft.allProjects, true); assert.deepEqual(Array.from(draft.projectIds), []);
});
test("HeroUI disclosures preserve drafts while excluding collapsed fields from keyboard and accessibility navigation", () => {
  for (const reducedMotion of [false, true]) {
    const h = componentHarness();
    const { SourceDisclosure: View } = h.load<{ SourceDisclosure: typeof SourceDisclosure }>(new URL("../../editor/disclosure/SourceDisclosure.tsx", import.meta.url), name => name === "framer-motion" ? { useReducedMotion: () => reducedMotion } : undefined);
    const render = () => nodes(h.render(() => View({ title: "Access", summary: "None", children: "credential fields" })));
    const content = (all: ReturnType<typeof render>) => all.find(node => node.type === "div" && node.props.children === "credential fields")!;
    const element = { inert: false };
    let all = render(), accordion = all[0];
    assert.equal(accordion.type, "Accordion"); assert.equal(accordion.props.keepContentMounted, true);
    assert.equal(accordion.props.disableAnimation, reducedMotion);
    assert.equal(all.find(node => node.type === "IntegrationControlScope")?.props.disabled, true);
    assert.ok(content(all), "mounted credentials have a focus-isolation wrapper");
    assert.equal(content(all).props["aria-hidden"], true);
    invoke(content(all), "ref", element); assert.equal(element.inert, true);
    invoke(accordion, "onSelectionChange", new Set(["settings"])); all = render(); accordion = all[0];
    assert.deepEqual(Array.from(accordion.props.selectedKeys as string[]), ["settings"]);
    assert.equal(content(all).props["aria-hidden"], undefined);
    assert.equal(all.find(node => node.type === "IntegrationControlScope")?.props.disabled, false);
    invoke(content(all), "ref", element); assert.equal(element.inert, false);
    invoke(accordion, "onSelectionChange", new Set()); all = render();
    assert.deepEqual(Array.from(all[0].props.selectedKeys as string[]), []);
    invoke(content(all), "ref", element); assert.equal(element.inert, true);
    assert.equal(content(all).props.children, "credential fields");
  }
});
test("a shared API explains disable scope without adding a notice to single-project connections", () => {
  const h = componentHarness();
  const state = { draft: sourceDraft(null, "p"), setDraft() {}, pending: false, error: null, save() {} };
  const { SourceEditor: View } = h.load<{ SourceEditor: typeof SourceEditor }>(new URL("../../editor/SourceEditor.tsx", import.meta.url), name => name.endsWith("useApiSourceEditor") ? { useApiSourceEditor: () => state } : undefined);
  const source = { id: "api", name: "Booking API" } as ApiSource;
  const render = () => nodes(h.render(() => View({ workspaceId: "w", projectId: "p", source, catalog: [], projects: [], ru: false, onClose() {}, onSaved() {}, onExisting() {}, onReload() {} })));
  const notice = () => render().find(node => node.type === "small" && typeof node.props.children === "string" && node.props.children.startsWith("Disabling affects"))?.props.children;
  assert.equal(notice(), undefined);
  state.draft.projectIds = ["p", "q"]; assert.equal(notice(), "Disabling affects all selected projects.");
  state.draft.allProjects = true; assert.equal(notice(), "Disabling affects every project in this workspace.");
});
