import assert from "node:assert/strict";
import test from "node:test";
import type { Suite, SuiteSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { filterSuiteCatalog, suiteCatalogCount } from "../../../../suites/catalog/suite-catalog";
import type { SuiteCatalog } from "../SuiteCatalog";

const suite = (patch: Partial<SuiteSummary> = {}): SuiteSummary => ({ id: "suite-a", projectId: "project-a", key: "WEB-TS-1", name: "Release smoke", description: "Checkout", type: "static", caseCount: 4, status: "active", createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-10-02T10:00:00Z", ...patch });
function setup() {
  const h = componentHarness();
  const { SuiteCatalog: View } = h.load<{ SuiteCatalog: typeof SuiteCatalog }>(new URL("../SuiteCatalog.tsx", import.meta.url), name =>
    name.endsWith("useTmsLocale") ? { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) }
      : name.endsWith("suite-catalog") ? { filterSuiteCatalog, suiteCatalogCount } : undefined);
  const events: string[] = [];
  const props = { suites: [suite(), suite({ id: "archived", status: "archived" })], detail: null as Suite | null, projectName: "Web", query: "", filter: "all" as const, sort: "updated" as const,
    canManage: true, canRun: true, onQuery: (value: string) => events.push(`query:${value}`), onFilter: (value: string) => events.push(`filter:${value}`), onSort() {},
    onOpen: (id: string) => events.push(`open:${id}`), onRun: (id: string) => events.push(`run:${id}`), onCreate: () => events.push("create") };
  const render = () => nodes(h.render(() => View(props)));
  return { h, props, events, render };
}
test("suite rows keep distinct open and run actions, return-focus marker, and archive restrictions", () => {
  const { h, render, events } = setup(); const all = render();
  const row = all.find(node => node.props["data-suite-id"] === "suite-a")!;
  const open = nodes(row).find(node => node.props["data-open-suite"] !== undefined)!;
  invoke(open, "onClick");
  invoke(all.find(node => node.props["aria-label"] === "Run suite: Release smoke" && !node.props.disabled)!, "onClick");
  invoke(all.find(node => node.props["data-testid"] === "new-suite")!, "onClick");
  assert.deepEqual(events, ["open:suite-a", "run:suite-a", "create"]);
  assert.equal(nodes(all.find(node => node.props["data-suite-id"] === "archived")!).find(node => node.props["aria-label"] === "Run suite: Release smoke")!.props.disabled, true);
  h.dispose();
});
test("read-only viewers can open suites without seeing create or execution actions", () => {
  const { h, props, render } = setup(); props.canManage = false; props.canRun = false;
  const all = render(); assert.equal(all.some(node => node.props["data-testid"] === "new-suite"), false);
  assert.equal(all.some(node => String(node.props["aria-label"]).startsWith("Run suite:")), false);
  assert.equal(all.filter(node => node.props["data-open-suite"] !== undefined).length, 2); h.dispose();
});
test("dynamic counts remain unknown until matching detail resolves them; filtered empty state resets the controls", () => {
  const { h, props, render, events } = setup(); props.suites = [suite({ type: "dynamic", caseCount: 0 })];
  let all = render(); assert.equal(all.some(node => node.props.title === "Open this suite to resolve its current membership"), true);
  invoke(all.find(node => node.props["aria-label"] === "View cases: Release smoke")!, "onClick");
  assert.deepEqual(events, ["open:suite-a"]); events.length = 0;
  props.detail = { ...props.suites[0], caseIds: [], filter: { tags: ["smoke"] }, resolvedCaseCount: 7 };
  all = render(); assert.equal(all.some(node => node.props.title === "Open this suite to resolve its current membership"), false);
  props.query = "not present"; all = render();
  invoke(all.find(node => node.type === "button" && node.props.children === "Reset search and filter")!, "onClick");
  assert.deepEqual(events, ["query:", "filter:all"]); h.dispose();
});
