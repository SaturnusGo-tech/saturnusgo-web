import assert from "node:assert/strict";
import test from "node:test";
import type { ImportHistory } from "../presentation/history/ImportHistory";
import type { ImportFile } from "../model/import-file";
import { groupImportHistory, importFileSize } from "../model/history-groups";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
function fixture() {
  const h = componentHarness();
  const state = { items: [] as ImportFile[], query: "", searching: false, loading: false, error: null as unknown, cursor: null,
    setQuery(value: string) { state.query = value; }, reload() {}, loadMore() {} };
  const { ImportHistory: View } = h.load<{ ImportHistory: typeof ImportHistory }>(new URL("../presentation/history/ImportHistory.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useImportHistory")) return { useImportHistory: () => state };
    if (name.endsWith("useImportFileActions")) return { useImportFileActions: () => ({ notice: "", error: "", preview: null, deletion: null, pending: false }) };
    if (name.endsWith("history-groups")) return { groupImportHistory, importFileSize };
  });
  return { state, render: () => nodes(h.render(() => View({ scope: { workspaceId: "w", projectId: "p" }, revision: 0, canManage: true }))) };
}
const file = { workspaceId: "w", projectId: "p", id: "f", fileName: "release.json", byteSize: 256, folderId: null,
  destinationPath: "/", authorId: "qa", createdAt: "2026-11-03T10:00:00Z", available: true, deleted: false };
test("empty import history has no redundant search field", () => {
  const f = fixture(), all = f.render();
  assert.equal(all.some(node => node.type === "input" || node.type === "AnimatedSearch"), false);
  assert.ok(all.find(node => node.type === "h3" && node.props.children === "No imports yet"));
  assert.ok(all.find(node => node.props.role === "status" && nodes(node.props.children).some(child => child.type === "h3")));
});
test("populated history exposes the shared search and keeps it available for zero results", () => {
  const f = fixture(); f.state.items = [file];
  const control = f.render().find(node => node.type === "AnimatedSearch")!; assert.ok(control);
  invoke(control, "onChange", "missing.json"); f.state.items = [];
  const searched = f.render();
  assert.equal(searched.find(node => node.type === "AnimatedSearch")?.props.value, "missing.json");
  assert.ok(searched.find(node => node.type === "h3" && node.props.children === "No matching files"));
});
test("clearing a filtered history retains search during reload, then hides it only when truly empty", () => {
  const f = fixture(); f.state.items = [file]; f.render();
  f.state.query = "missing"; f.state.items = []; f.render();
  f.state.query = ""; f.state.loading = true;
  assert.ok(f.render().find(node => node.type === "AnimatedSearch"));
  f.state.loading = false;
  assert.equal(f.render().some(node => node.type === "AnimatedSearch"), false);
});

test("a failed unfiltered refresh cannot hide search for previously populated history", () => {
  const f = fixture(); f.state.items = [file]; f.render();
  f.state.items = []; f.state.error = new Error("Read failed");
  assert.ok(f.render().find(node => node.type === "AnimatedSearch"));
});
