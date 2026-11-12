import { installIntegrationTestControls } from "../support/control-test-boundary";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTmsHttpClient, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import type { ImpactAnalysis } from "../../model/impact-types";
import { analysis, scope } from "../fixtures/impact-fixture";

const require = createRequire(import.meta.url);
const previousCss = require.extensions[".css"];
const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
let AnalysisList: typeof import("../../presentation/list/AnalysisList")["AnalysisList"];
let AnalysisDetail: typeof import("../../presentation/detail/AnalysisDetail")["AnalysisDetail"];
let CoverageGaps: typeof import("../../presentation/gaps/CoverageGaps")["CoverageGaps"];
let restoreControls: () => void;
before(async () => {
  restoreControls = installIntegrationTestControls();
  require.extensions[".css"] = module => { module.exports = {}; };
  Object.assign(globalThis, { React });
  ({ AnalysisList } = await import("../../presentation/list/AnalysisList"));
  ({ AnalysisDetail } = await import("../../presentation/detail/AnalysisDetail"));
  ({ CoverageGaps } = await import("../../presentation/gaps/CoverageGaps"));
});
after(() => {
  restoreControls();
  if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
  if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
});
const permissions = { read: true, configure: true, review: true, manageCases: true, audit: false };
const tree = (http: TmsHttpClient, subject: string, child: React.JSX.Element): React.JSX.Element =>
  React.createElement(TmsHttpClientProvider, { client: http, children: React.createElement(TmsSessionProvider,
    { value: { kind: "managed", label: "QA", subject, signOut: async () => {} }, children: child }) });
const content = (root: ReactTestRenderer) => JSON.stringify(root.toJSON(), (_key, value) => React.isValidElement(value) ? undefined : value);
const button = (root: ReactTestRenderer, label: string) => root.root.findAllByType("button").find(item => item.children.includes(label));
function historical(aiEnabled: boolean, status: "complete" | "disabled" = "complete"): ImpactAnalysis {
  return analysis({ aiEnabled, result: {
    summary: "Historical payment impact remains available", riskLevel: "medium", impactedAreas: [], notes: [],
    selectedTestCases: [{ testCaseId: "case_preserved", confidence: 0.9, reason: "Original review recommendation", changedFiles: ["src/payments.ts"] }],
    coverageGaps: [{ id: "gap_legacy", area: "Payment recovery", platform: "backend", reason: "Check interrupted payment recovery",
      changedFiles: ["src/payments.ts"], suggestedTestCases: ["Retry an interrupted payment"] }],
    ai: { status, provider: "historical-provider", model: "historical-model", promptVersion: "v1", schemaVersion: "v1",
      inputTokens: 50, outputTokens: 25, cost: null, latencyMs: 30, candidateCount: 1 },
  } });
}
async function detail(item: ImpactAnalysis, subject: string, openDetails = true, audit = false) {
  const commands: { path: string; body: unknown; etag: string | null; key: string | null }[] = [];
  const focusedTabs: number[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith("/activity")) return Response.json({ data: [], nextCursor: null });
    if (init?.method === "POST") {
      const headers = new Headers(init.headers);
      commands.push({ path, body: JSON.parse(String(init.body)), etag: headers.get("if-match"), key: headers.get("idempotency-key") });
    }
    return Response.json({ data: item }, { headers: { etag: "v7" } });
  } });
  let root!: ReactTestRenderer;
  await act(async () => { root = create(tree(http, subject, React.createElement(AnalysisDetail,
    { scope, id: item.id, permissions: { ...permissions, audit }, ru: false, onBack: () => {} })), { createNodeMock: node =>
      node.type === "nav" && node.props.role === "tablist" ? { querySelectorAll: () => [0, 1, 2, 3].map(index => ({ focus: () => focusedTabs.push(index) })) } : null }); });
  const revokeAudit = () => root.update(tree(http, subject, React.createElement(AnalysisDetail, { scope, id: item.id, permissions, ru: false, onBack: () => {} })));
  if (!openDetails) return { root, commands, focusedTabs, revokeAudit };
  const recommendation = root.root.findAllByType("button").find(node => String(node.props["aria-label"]).startsWith("Selection details:"));
  if (recommendation) await act(async () => recommendation.props.onPress());
  const gapsTab = root.root.findAllByType("button").filter(node => node.props.role === "tab").find(tab => tab.props["aria-controls"]?.includes("gaps"));
  if (gapsTab) await act(async () => gapsTab.props.onPress());
  const firstGap = root.root.findAllByType("button").find(item => String(item.props["aria-label"]).startsWith("Expand coverage gap:"));
  if (firstGap) await act(async () => firstGap.props.onPress());
  return { root, commands, focusedTabs, revokeAudit };
}

test("an empty list shows the optional-AI banner only after the server disables AI", async () => {
  let respond!: (response: Response) => void;
  const http = createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: () =>
    new Promise(resolve => { respond = resolve; }) });
  let root!: ReactTestRenderer;
  try {
    await act(async () => { root = create(tree(http, "availability-empty-list", React.createElement(AnalysisList,
      { scope, enabled: true, ru: false, onSelect: () => {} }))); });
    assert.equal(root.root.findAllByProps({ "aria-label": "AI availability" }).length, 0);
    await act(async () => respond(Response.json({ data: [], nextCursor: null, aiEnabled: false })));
    const banner = root.root.findByProps({ "aria-label": "AI availability" });
    assert.equal(banner.type, "aside"); assert.equal(banner.props.role, "status");
    assert.match(content(root), /No analyses yet/); assert.match(content(root), /manual review remain available/);
    await act(async () => root.root.findAllByType("button").find(node => node.props["aria-label"] === "Refresh analyses")!.props.onPress());
    await act(async () => respond(Response.json({ data: [], nextCursor: null, aiEnabled: true })));
    assert.equal(root.root.findAllByProps({ "aria-label": "AI availability" }).length, 0);
  } finally { await act(async () => root?.unmount()); }
});
test("current AI-disabled configuration preserves historical recommendations and manual review actions", async () => {
  const { root, commands } = await detail(historical(false), "availability-history-disabled");
  try {
    assert.equal(root.root.findAllByProps({ "aria-label": "AI availability" }).length, 1);
    assert.match(content(root), /Historical payment impact remains available/);
    assert.match(content(root), /Original review recommendation/); assert.match(content(root), /historical-model/);
    assert.equal(button(root, "Generate AI draft"), undefined);
    const manual = button(root, "Create manual draft")!; const acknowledge = button(root, "Acknowledge gap")!;
    assert.notEqual(manual.props.isDisabled, true); assert.notEqual(acknowledge.props.isDisabled, true);
    await act(async () => manual.props.onPress());
    assert.equal(commands[0].path, "/api/v1/impact/analyses/analysis_qa/gaps/gap_legacy/generate");
    assert.deepEqual(commands[0].body, { mode: "manual" }); assert.equal(commands[0].etag, "v7"); assert.ok(commands[0].key);
  } finally { await act(async () => root.unmount()); }
});
test("current AI-enabled configuration exposes generation despite a historical disabled result", async () => {
  const { root, commands } = await detail(historical(true, "disabled"), "availability-history-enabled");
  try {
    assert.equal(root.root.findAllByProps({ "aria-label": "AI availability" }).length, 0);
    const generate = button(root, "Generate AI draft")!;
    assert.ok(generate); assert.notEqual(generate.props.isDisabled, true);
    await act(async () => generate.props.onPress());
    assert.equal(commands[0].path, "/api/v1/impact/analyses/analysis_qa/gaps/gap_legacy/generate");
    assert.deepEqual(commands[0].body, { mode: "ai" }); assert.equal(commands[0].etag, "v7"); assert.ok(commands[0].key);
  } finally { await act(async () => root.unmount()); }
});

test("gap review expands one row and preserves acknowledgment text while pending commands disable actions", async () => {
  const item = historical(false), first = item.result!.coverageGaps[0];
  item.result!.coverageGaps.push({ ...first, id: "gap_second", area: "Session recovery" });
  const commands: unknown[] = [], command = async (value: unknown) => { commands.push(value); };
  const props = { analysis: item, ru: false, writable: true, pending: false, command };
  const regions = new Map<string, { inert: boolean }>();
  let root!: ReactTestRenderer;
  try {
    await act(async () => { root = create(React.createElement(CoverageGaps, props) as React.JSX.Element, { createNodeMock: node => {
      if (node.props.role !== "region") return null;
      const element = { inert: false }; regions.set(node.props.id, element); return element;
    } }); });
    const trigger = (area: string) => root.root.findAllByType("button").find(node => String(node.props["aria-label"]).endsWith(`coverage gap: ${area}`))!;
    assert.ok(root.root.findAllByProps({ role: "region" }).every(node => node.props["aria-hidden"] === true));
    assert.ok([...regions.values()].every(element => element.inert));
    await act(async () => trigger(first.area).props.onPress());
    assert.equal(trigger(first.area).props["aria-expanded"], true);
    assert.equal([...regions.values()].filter(element => !element.inert).length, 1);
    await act(async () => button(root, "Acknowledge gap")!.props.onPress());
    await act(async () => root.root.findByType("textarea").props.onValueChange("Covered in the release regression."));
    await act(async () => trigger("Session recovery").props.onPress());
    assert.equal(trigger(first.area).props["aria-expanded"], false); assert.equal(trigger("Session recovery").props["aria-expanded"], true);
    await act(async () => trigger(first.area).props.onPress());
    await act(async () => button(root, "Acknowledge gap")!.props.onPress());
    assert.equal(root.root.findByType("textarea").props.value, "Covered in the release regression.");
    await act(async () => root.update(React.createElement(CoverageGaps, { ...props, pending: true }) as React.JSX.Element));
    assert.equal(root.root.findByType("textarea").props.isDisabled, true);
    assert.ok(root.root.findAllByType("button").filter(node => node.children.includes("Create manual draft")).every(node => node.props.isDisabled));
    await act(async () => root.root.findByType("form").props.onSubmit({ preventDefault() {} }));
    assert.deepEqual(commands, []);
  } finally { await act(async () => root?.unmount()); }
});

test("analysis tabs keep sections mounted, reveal only the selected panel and support keyboard navigation", async () => {
  const { root, focusedTabs } = await detail(historical(false), "availability-detail-tabs", false);
  const panel = (suffix: string) => root.root.findAllByProps({ role: "tabpanel" }).find(node => node.props.id.endsWith(`-${suffix}`))!;
  const tab = (label: string) => root.root.findAllByType("button").find(node => node.props.role === "tab" && node.props["aria-label"] === label)!;
  try {
    assert.equal(panel("scope").props.hidden, false); assert.equal(panel("gaps").props.hidden, true);
    assert.equal(tab("Verification scope").props.tabIndex, 0);
    assert.equal(root.root.findAllByProps({ id: "impact-coverage-gaps" }).length, 1);
    assert.equal(root.root.findAllByType("button").filter(node => node.props.role === "tab").length, 3);
    let prevented = false;
    await act(async () => root.root.findByProps({ role: "tablist" }).props.onKeyDown({ key: "ArrowRight", preventDefault() { prevented = true; } }));
    assert.equal(prevented, true); assert.deepEqual(focusedTabs, [1]);
    assert.equal(tab("Coverage gaps").props["aria-selected"], true);
    assert.equal(panel("scope").props.hidden, true); assert.equal(panel("gaps").props.hidden, false);
    await act(async () => tab("Verification scope").props.onPress());
    assert.equal(panel("scope").props.hidden, false); assert.equal(panel("gaps").props.hidden, true);
    assert.equal(root.root.findAllByProps({ id: "impact-coverage-gaps" }).length, 1);
    assert.equal(root.root.findAllByProps({ id: "impact-scope-review" }).length, 1);
    assert.equal(root.root.findAllByType("button").filter(node => node.props.role === "tab").some(node => node.props["aria-controls"].endsWith("-activity")), false);
  } finally { await act(async () => root.unmount()); }
});

test("revoking audit access restores a visible keyboard-accessible review tab", async () => {
  const { root, revokeAudit } = await detail(historical(false), "availability-revoke-audit", false, true);
  try {
    await act(async () => root.root.findAllByType("button").find(node => node.props.role === "tab" && node.props["aria-label"] === "Activity")!.props.onPress());
    assert.equal(root.root.findAllByType("button").find(node => node.props.role === "tab" && node.props["aria-label"] === "Activity")!.props["aria-selected"], true);
    await act(async () => revokeAudit());
    assert.equal(root.root.findAllByProps({ role: "tab", "aria-label": "Activity" }).length, 0);
    const scopeTab = root.root.findAllByType("button").find(node => node.props.role === "tab" && node.props["aria-label"] === "Verification scope")!;
    assert.equal(scopeTab.props["aria-selected"], true); assert.equal(scopeTab.props.tabIndex, 0);
    assert.equal(root.root.findAllByProps({ role: "tabpanel" }).find(node => node.props.id.endsWith("-scope"))!.props.hidden, false);
  } finally { await act(async () => root.unmount()); }
});
