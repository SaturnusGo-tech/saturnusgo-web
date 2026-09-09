import { test } from "node:test";
import assert from "node:assert/strict";
import { createNavigationHistory, navigationEntry } from "../history";
import { buildWorkspaceDeepLink } from "../../workspace-deep-link";
import { buildCaseDeepLink } from "../../../../test-cases/navigation/case-deep-link";
import { buildDefectDeepLink } from "../../../../defects/navigation/defect-deep-link";
import { buildSuiteRoute } from "../../../../suites/navigation/suite-route";
function fixture(query = "view=suites&suiteId=suite-1") {
  const entries = [{ href: `https://tms.example/work/?workspaceId=workspace-1&projectId=project-1&${query}`, state: { __NA: true } as Record<string, unknown> }];
  let index = 0; const ends = new Map<string, number>();
  const port = { href: () => entries[index].href, state: () => entries[index].state,
    replace: (state: Record<string, unknown>, href: string) => { entries[index] = { href, state }; },
    push: (state: Record<string, unknown>, href: string) => { entries.splice(++index, entries.length, { href, state }); },
    changed: () => {}, session: () => "session-1", readEnd: (id: string) => ends.get(id) ?? 0,
    writeEnd: (id: string, index: number) => { ends.set(id, index); } };
  const history = createNavigationHistory(port);
  return { history, port, entries, current: () => entries[index], back: () => { index--; }, forward: () => { index++; } };
}
test("suite → case → back restores exact suite route, search, scroll and browser state", () => {
  const f = fixture(); f.history.initialize(); const origin = f.current().href;
  f.history.context("suite:query", "Refund"); f.history.context("scroll", [{ key: "list", top: 240 }]);
  f.history.write(buildCaseDeepLink(origin, { workspaceId: "workspace-1", projectId: "project-1", caseId: "case-12" }));
  assert.equal(new URL(f.current().href).searchParams.get("caseId"), "case-12");
  assert.equal(f.entries.length, 2); assert.equal(f.current().state.__NA, true);
  assert.deepEqual(f.history.position(), { back: true, forward: false });
  f.back(); assert.equal(f.current().href, origin);
  assert.equal(navigationEntry(f.current().state)?.context["suite:query"], "Refund");
  assert.deepEqual(navigationEntry(f.current().state)?.context.scroll, [{ key: "list", top: 240 }]);
  assert.deepEqual(f.history.position(), { back: false, forward: true });
  f.forward(); assert.equal(new URL(f.current().href).searchParams.get("caseId"), "case-12");
});
test("dashboard drill → defect → run retains each source without leaking dashboard close marker", () => {
  const f = fixture("view=dashboard&dashboardDetail=component-refund");
  f.history.initialize(); f.port.replace({ ...f.port.state(), falconDashboardDetail: true }, f.port.href());
  const source = f.current().href;
  f.history.write(buildDefectDeepLink(source, { projectId: "project-1", defectId: "bug-1" }));
  assert.equal(f.current().state.falconDashboardDetail, undefined); const defect = f.current().href;
  f.history.write(buildWorkspaceDeepLink(defect, { workspaceId: "workspace-1", projectId: "project-1", view: "runs", runId: "run-2", runItemId: "item-4" }));
  f.back(); assert.equal(f.current().href, defect); f.back(); assert.equal(f.current().href, source);
  assert.equal(f.current().state.falconDashboardDetail, true);
});
test("canonicalization and duplicate writes do not add extra entries", () => {
  const f = fixture("view=suites"); const href = buildSuiteRoute(f.port.href(), "workspace-1", "project-1", null);
  f.history.write(href, true); f.history.write(href); f.history.write(href);
  assert.equal(f.entries.length, 1); assert.deepEqual(f.history.position(), { back: false, forward: false });
});
test("new navigation after back discards forward branch", () => {
  const f = fixture(); f.history.write(f.port.href() + "&first=1"); f.history.write(f.port.href() + "&second=1");
  f.back(); f.history.write(f.port.href() + "&alternative=1");
  assert.equal(f.entries.length, 3); assert.deepEqual(f.history.position(), { back: true, forward: false });
});
test("history context is immutable between entries and survives controller remount", () => {
  const f = fixture(); f.history.context("query", "original"); f.history.write(f.port.href() + "&next=1");
  f.history.context("query", "changed");
  assert.equal(navigationEntry(f.entries[0].state)?.context.query, "original");
  const remounted = createNavigationHistory(f.port); assert.deepEqual(remounted.position(), { back: true, forward: false });
});
test("cross-project navigation keeps the source scope", () => {
  const f = fixture(); const origin = f.port.href();
  f.history.write(buildWorkspaceDeepLink(origin, { workspaceId: "workspace-1", projectId: "project-2", view: "runs", runId: "run-2" }));
  assert.equal(new URL(f.port.href()).searchParams.get("suiteId"), null);
  f.back(); assert.equal(f.port.href(), origin);
});
test("external URL and route escape are rejected without mutating history", () => {
  const f = fixture(); assert.throws(() => f.history.write("https://elsewhere.test/"));
  assert.throws(() => f.history.write("https://tms.example/admin")); assert.equal(f.entries.length, 1);
});
test("malformed metadata starts an isolated history and cannot enable external Back", () => {
  const f = fixture(); f.current().state.falconNavigation = { session: "bad", index: -10, context: {} };
  assert.deepEqual(f.history.position(), { back: false, forward: false });
});
