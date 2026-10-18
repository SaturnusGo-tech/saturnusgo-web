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
before(async () => {
  require.extensions[".css"] = module => { module.exports = {}; };
  Object.assign(globalThis, { React });
  ({ AnalysisList } = await import("../../presentation/list/AnalysisList"));
  ({ AnalysisDetail } = await import("../../presentation/detail/AnalysisDetail"));
});
after(() => {
  if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
  if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
});
const permissions = { read: true, configure: true, review: true, manageCases: true, audit: false };
const tree = (http: TmsHttpClient, subject: string, child: React.JSX.Element): React.JSX.Element =>
  React.createElement(TmsHttpClientProvider, { client: http, children: React.createElement(TmsSessionProvider,
    { value: { kind: "managed", label: "QA", subject, signOut: async () => {} }, children: child }) });
const content = (root: ReactTestRenderer) => JSON.stringify(root.toJSON());
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
async function detail(item: ImpactAnalysis, subject: string) {
  const commands: { path: string; body: unknown; etag: string | null; key: string | null }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (init?.method === "POST") {
      const headers = new Headers(init.headers);
      commands.push({ path, body: JSON.parse(String(init.body)), etag: headers.get("if-match"), key: headers.get("idempotency-key") });
    }
    return Response.json({ data: item }, { headers: { etag: "v7" } });
  } });
  let root!: ReactTestRenderer;
  await act(async () => { root = create(tree(http, subject, React.createElement(AnalysisDetail,
    { scope, id: item.id, permissions, ru: false, onBack: () => {} }))); });
  return { root, commands };
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
    await act(async () => button(root, "Refresh")!.props.onClick());
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
    assert.notEqual(manual.props.disabled, true); assert.notEqual(acknowledge.props.disabled, true);
    await act(async () => manual.props.onClick());
    assert.equal(commands[0].path, "/api/v1/impact/analyses/analysis_qa/gaps/gap_legacy/generate");
    assert.deepEqual(commands[0].body, { mode: "manual" }); assert.equal(commands[0].etag, "v7"); assert.ok(commands[0].key);
  } finally { await act(async () => root.unmount()); }
});
test("current AI-enabled configuration exposes generation despite a historical disabled result", async () => {
  const { root, commands } = await detail(historical(true, "disabled"), "availability-history-enabled");
  try {
    assert.equal(root.root.findAllByProps({ "aria-label": "AI availability" }).length, 0);
    const generate = button(root, "Generate AI draft")!;
    assert.ok(generate); assert.notEqual(generate.props.disabled, true);
    await act(async () => generate.props.onClick());
    assert.equal(commands[0].path, "/api/v1/impact/analyses/analysis_qa/gaps/gap_legacy/generate");
    assert.deepEqual(commands[0].body, { mode: "ai" }); assert.equal(commands[0].etag, "v7"); assert.ok(commands[0].key);
  } finally { await act(async () => root.unmount()); }
});
