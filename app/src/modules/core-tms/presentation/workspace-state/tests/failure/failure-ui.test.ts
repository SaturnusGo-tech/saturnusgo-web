import assert from "node:assert/strict";
import test from "node:test";
import type { WorkspaceLoadState } from "../../WorkspaceLoadState";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";

test("workspace failure offers recovery without exposing diagnostics or development actions", () => {
  const h = componentHarness(); let retried = 0;
  const { WorkspaceLoadState: View } = h.load<{ WorkspaceLoadState: typeof WorkspaceLoadState }>(new URL("../../WorkspaceLoadState.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
    if (name.endsWith("WorkspaceStartup")) return { useWorkspaceStartupCovered: () => false };
  });
  for (const detail of ["status 500", "status 403", "unreachable"]) {
    const tree = h.render(() => View({ failure: { detail, requestId: "private-request-123" }, onRetry: () => retried++ }));
    const all = nodes(tree), rendered = JSON.stringify(tree);
    assert.doesNotMatch(rendered, /private-request-123|api\.statusError|api\.unreachable|workspace\.openDemo|workspace\.productionProtected|workspace\.noLocalReplacement/);
    assert.equal(all.filter(node => node.type === "h1").length, 1);
    assert.equal(all.filter(node => node.type === "button").length, 1);
    invoke(all.find(node => node.type === "button")!, "onClick");
  }
  assert.equal(retried, 3);
  const loading = nodes(h.render(() => View({ failure: null, onRetry() {} })));
  assert.ok(loading.some(node => node.props.testId === "workspace-loading"));
  assert.equal(loading.some(node => node.type === "button"), false);
});
