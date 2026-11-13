import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { formHarness } from "../forms/form-harness";

test("environment row toggles and New never replace an editor until leave is approved", async t => {
  const h = componentHarness(); t.after(() => h.dispose()); let allowed = false, attempts = 0, toggles = 0;
  const { EnvironmentSettings: View } = h.load<{ EnvironmentSettings: (props: Record<string, unknown>) => unknown }>(new URL("../../../../presentation/config/sections/EnvironmentSettings.tsx", import.meta.url), name => {
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: async (action: (commit: (update: () => void) => void) => unknown) => { attempts++; if (allowed) await action(update => update()); return allowed; } };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("layout-transition")) return { transitionEnvironmentLayout: (action: () => void) => action() };
    return undefined;
  });
  const props = { environments: [{ id: "env", name: "Staging", key: "STG", baseUrl: "https://test" }], projectId: "p", projectName: "Project", offline: false, onSaved() {}, onToggle() { toggles++; } };
  const render = () => nodes(h.render(() => View(props)));
  await invoke(render().find(node => node.type === "EnvironmentRow")!, "onEdit");
  assert.equal(render().find(node => node.type === "EnvironmentRow")!.props.editor, undefined); assert.equal(attempts, 1);
  allowed = true; await invoke(render().find(node => node.type === "EnvironmentRow")!, "onEdit");
  assert.ok(render().find(node => node.type === "EnvironmentRow")!.props.editor);
  allowed = false;
  await invoke(render().find(node => node.props["data-testid"] === "new-environment")!, "onClick");
  assert.ok(render().find(node => node.type === "EnvironmentRow")!.props.editor);
  await invoke(render().find(node => node.type === "EnvironmentRow")!, "onToggle"); assert.equal(toggles, 0);
});

test("documentation comment is dirty while typed, busy while posting, retained on error, clear after success", async t => {
  const f = formHarness(); t.after(() => f.h.dispose()); let success = false, complete: (() => void) | undefined;
  const { ProductDocActivity: View } = f.load<{ ProductDocActivity: (props: Record<string, unknown>) => unknown }>(new URL("../../../../product-docs/presentation/activity/ProductDocActivity.tsx", import.meta.url), name => {
    if (name.endsWith("/presentation")) return { notificationTime: () => "now" };
    if (name.endsWith("useProductDocResource")) return { useProductDocResource: () => ({ status: "ready", data: { comments: [], canComment: true } }) };
    return undefined;
  });
  const api = { listComments() {}, postComment: async () => {
    await new Promise<void>(resolve => { complete = resolve; });
    if (!success) throw Error("offline");
    return { id: "comment", body: "Message", createdAt: "2026-11-13T10:00:00Z", author: { displayName: "QA", identityId: "qa" } };
  } };
  const render = () => f.render(() => View({ api, scope: { workspaceId: "w", projectId: "p" }, document: { id: "doc", publishedVersion: 1, version: 1 }, locale: "en", copy: {} }));
  render(); assert.equal(f.session()?.dirty, false);
  invoke(render().find(node => node.type === "Textarea")!, "onValueChange", "Message"); render(); assert.equal(f.session()?.dirty, true);
  invoke(render().find(node => node.type === "form")!, "onSubmit", { preventDefault() {} }); render(); assert.equal(f.session()?.busy, true);
  complete?.(); await new Promise(resolve => setImmediate(resolve)); render(); assert.equal(f.session()?.dirty, true); assert.equal(f.session()?.busy, false);
  success = true; invoke(render().find(node => node.type === "form")!, "onSubmit", { preventDefault() {} }); render(); complete?.();
  await new Promise(resolve => setImmediate(resolve)); render(); assert.equal(f.session()?.dirty, false);
  invoke(render().find(node => node.type === "Textarea")!, "onValueChange", "Next comment"); render(); assert.equal(f.session()?.dirty, true);
});
