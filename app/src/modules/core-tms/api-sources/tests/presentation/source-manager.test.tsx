import assert from "node:assert/strict";
import test from "node:test";
import type { ApiSourceManager } from "../../presentation/ApiSourceManager";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
function fixture(empty = true) {
  const h = componentHarness(); let backed = 0, refreshed = 0, saved: unknown;
  const source = { id: "source-1", name: "Booking API", sourceUrl: "https://api.test/spec.json", projectIds: ["p"], enabled: true };
  const catalog = { items: empty ? [] : [source], loading: false, error: null, refresh: () => refreshed++ };
  const projects = { items: [{ id: "p", name: "Project" }], loading: false, error: false, retry() {} };
  const { ApiSourceManager: View } = h.load<{ ApiSourceManager: typeof ApiSourceManager }>(new URL("../../presentation/ApiSourceManager.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useApiSourceList")) return { useApiSourceList: () => catalog };
    if (name.endsWith("useApiProjects")) return { useApiProjects: () => projects };
    if (name.endsWith("api-source-error")) return { apiSourceError: () => "Unavailable" };
  });
  return { source, catalog, projects, render: () => nodes(h.render(() => View({ workspaceId: "w", projectId: "p", onBack: () => backed++, onSaved: value => { saved = value; } }))), counts: () => ({ backed, refreshed, saved }) };
}
test("empty Swagger catalog opens the scoped setup page directly and cancel returns to plugin", () => {
  const f = fixture(), all = f.render(), editor = all.find(node => node.type === "SourceEditor")!;
  assert.ok(editor); assert.equal(editor.props.workspaceId, "w"); assert.equal(editor.props.projectId, "p"); assert.equal(editor.props.source, null);
  assert.equal(all.some(node => node.type === "input" || node.type === "h1" || node.props.role === "dialog"), false);
  invoke(editor, "onPendingChange", true);
  assert.equal(f.render().find(node => node.type === "button" && node.props.children === "Swagger")?.props.disabled, true);
  invoke(editor, "onPendingChange", false);
  invoke(editor, "onClose"); assert.equal(f.counts().backed, 1);
});
test("project loading or failure never exposes an incomplete connection form", () => {
  const f = fixture(); f.projects.loading = true;
  assert.equal(f.render().some(node => node.type === "SourceEditor"), false);
  f.projects.loading = false; f.projects.error = true;
  const all = f.render(); assert.equal(all.some(node => node.type === "SourceEditor"), false);
  assert.ok(all.some(node => node.type === "ErrorToast" && Boolean(node.props.message)));
});
test("saved API appears in the real connection list and can be reopened or reloaded", () => {
  const f = fixture(); const editor = f.render().find(node => node.type === "SourceEditor")!;
  invoke(editor, "onPendingChange", true);
  f.catalog.items.push(f.source); invoke(editor, "onSaved", f.source);
  assert.equal(f.counts().refreshed, 1); assert.equal(f.counts().saved, f.source);
  let all = f.render(); assert.equal(all.find(node => node.type === "button" && node.props.children === "Swagger")?.props.disabled, false);
  assert.equal(all.some(node => node.type === "SourceEditor" || node.type === "input"), false);
  const row = all.find(node => node.type === "button" && nodes(node.props.children).some(child => child.type === "strong" && child.props.children === "Booking API"))!;
  invoke(row, "onClick"); all = f.render(); const edit = all.find(node => node.type === "SourceEditor")!;
  assert.equal(edit.props.source, f.source); invoke(edit, "onReload"); assert.equal(f.counts().refreshed, 2);
  assert.equal(f.render().some(node => node.type === "SourceEditor"), false);
});
