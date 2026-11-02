import assert from "node:assert/strict";
import test from "node:test";
import type { Suite, TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { matchesSuite } from "../../../../helpers/suites/matchesSuite";
import type { SuiteDetail } from "../SuiteDetail";

const detail: Suite = { id: "suite-a", projectId: "project-a", key: "WEB-TS-1", name: "Release smoke", description: "", type: "static", caseCount: 5, status: "active", createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-10-02T10:00:00Z", caseIds: ["included", "archived", "foreign"], filter: {}, resolvedCaseCount: 2 };
const item = (id: string, patch: Partial<TestCaseSummary> = {}) => ({ id, projectId: "project-a", archivedAt: null, folderPath: "/", tags: [], priority: "high", lifecycle: "ready", ...patch }) as TestCaseSummary;
function setup() {
  const h = componentHarness(); const events: string[] = []; let previewError = false;
  const { SuiteDetail: View } = h.load<{ SuiteDetail: typeof SuiteDetail }>(new URL("../SuiteDetail.tsx", import.meta.url), name =>
    name.endsWith("useTmsLocale") ? { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) }
      : name.endsWith("useSuitePreview") ? { useSuitePreview: (cases: TestCaseSummary[], suite: Suite | null) => ({ cases: suite ? cases.filter(value => matchesSuite(value, suite)) : [], loading: false, error: previewError, retry: () => events.push("preview-retry") }) } : undefined);
  const props = { suite: detail, detail: detail as Suite | null, cases: [item("included"), item("other"), item("archived", { archivedAt: "2026-10-01" }), item("foreign", { projectId: "project-b" })], folders: [], projectName: "Web",
    error: false, onRetry: () => events.push("detail-retry"), onBack: () => events.push("back"), canManage: true, canRun: true,
    onConfigure: (id: string) => events.push(`configure:${id}`), onRun: (id: string) => events.push(`run:${id}`), onOpenCase: (value: TestCaseSummary) => events.push(`case:${value.id}`) };
  const render = () => nodes(h.render(() => View(props)));
  return { h, props, events, render, failPreview: () => { previewError = true; } };
}
test("suite detail passes only the resolved membership to the case list and preserves case navigation", () => {
  const { h, render, events } = setup(); const all = render();
  const repository = all.find(node => node.type === "SuiteRepository")!;
  assert.deepEqual((repository.props.cases as TestCaseSummary[]).map(value => value.id), ["included"]);
  invoke(repository, "onOpen", item("included"));
  invoke(all.find(node => node.props["aria-label"] === "Run suite")!, "onClick");
  assert.deepEqual(events, ["case:included", "run:suite-a"]);
  assert.equal(all.some(node => typeof node.props.children === "string" && node.props.children.includes("1 of 2 cases loaded")), true); h.dispose();
});
test("failure states do not present stale membership and retry the correct data source", () => {
  const { h, props, render, events, failPreview } = setup(); props.detail = null; props.error = true;
  let all = render(); assert.equal(all.some(node => node.type === "SuiteRepository"), false);
  invoke(all.find(node => node.type === "button" && nodes(node).some(child => child.type === "ArrowRotateCw"))!, "onClick");
  props.detail = detail; props.error = false; failPreview(); all = render();
  invoke(all.find(node => node.type === "button" && nodes(node).some(child => child.type === "ArrowRotateCw"))!, "onClick");
  assert.deepEqual(events, ["detail-retry", "preview-retry"]); h.dispose();
});
test("archive restrictions and read-only rights survive the detail presentation", () => {
  const { h, props, render } = setup(); props.suite = { ...detail, status: "archived" }; props.detail = props.suite;
  let all = render(); assert.equal(all.find(node => node.props["aria-label"] === "Run suite")!.props.disabled, true);
  assert.equal(all.find(node => node.type === "button" && nodes(node).some(child => child.type === "Settings"))!.props.disabled, true);
  props.canManage = false; props.canRun = false; all = render();
  assert.equal(all.some(node => node.props["aria-label"] === "Run suite"), false);
  assert.equal(all.some(node => node.type === "Settings"), false); h.dispose();
});
