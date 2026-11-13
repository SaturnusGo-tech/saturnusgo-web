import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import { companyViewAvailable } from "../../../auth/managed/domain/features/company-features";
import type { WorkspaceStage } from "../WorkspaceStage";

test("every authenticated account can open its profile without a loaded project", () => {
  for (const kind of ["cloud", "managed", "admin", null]) {
    const h = componentHarness();
    const { WorkspaceStage: render } = h.load<{ WorkspaceStage: typeof WorkspaceStage }>(new URL("../WorkspaceStage.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
      if (name.endsWith("useWorkspaceCapabilities")) return { useWorkspaceCapabilities: () => ({ value: { canConnect: true } }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => kind ? { kind, companyCapabilities: [] } : null };
      if (name.endsWith("company-features")) return { companyViewAvailable };
    });
    const model = { view: "profile", connection: "loading", project: undefined,
      data: { workspace: { id: "w" }, meta: { authorization: { capabilities: [] } } } };
    const all = nodes(h.render(() => render({ model: model as never })));
    assert.equal(all.some(node => node.type === "WorkspaceProfile"), kind !== null, String(kind));
    assert.equal(all.some(node => node.type === "WorkspaceLoadState"), false);
  }
});

test("team is available to ordinary members before any project is loaded", () => {
  const h = componentHarness();
  const { WorkspaceStage: render } = h.load<{ WorkspaceStage: typeof WorkspaceStage }>(new URL("../WorkspaceStage.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
    if (name.endsWith("useWorkspaceCapabilities")) return { useWorkspaceCapabilities: () => ({ value: null }) };
    if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => ({ kind: "managed", companyCapabilities: [] }) };
    if (name.endsWith("company-features")) return { companyViewAvailable };
  });
  const model = { view: "team", connection: "loading", project: undefined,
    data: { workspace: { id: "w", name: "Team" }, meta: { authorization: { capabilities: [] } } } };
  assert.ok(nodes(h.render(() => render({ model: model as never }))).some(node => node.type === "TeamFeature"));
});
