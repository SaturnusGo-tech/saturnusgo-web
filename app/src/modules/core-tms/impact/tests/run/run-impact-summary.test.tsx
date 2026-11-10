import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import type { ImpactAnalysis } from "../../model/impact-types";
import { analysis, scope, storageFixture } from "../fixtures/impact-fixture";

const require = createRequire(import.meta.url), previousCss = require.extensions[".css"];
const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
let Summary: typeof import("../../presentation/run/RunImpactSummary")["RunImpactSummary"];
let ErrorToast: typeof import("../../../presentation/common/error/ErrorToast")["ErrorToast"];
type SummaryProps = Parameters<typeof Summary>[0];
type SummaryUpdate = Omit<Partial<SummaryProps>, "state"> & { state?: Partial<SummaryProps["state"]> };
before(async () => {
  require.extensions[".css"] = module => { module.exports = {}; };
  Object.assign(globalThis, { React });
  ({ RunImpactSummary: Summary } = await import("../../presentation/run/RunImpactSummary"));
  ({ ErrorToast } = await import("../../../presentation/common/error/ErrorToast"));
});
after(() => {
  if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
  if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
});

function fixture(t: TestContext, items: ImpactAnalysis[] = [analysis()], blockedStorage = false) {
  const storage = storageFixture(), originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: { href: "http://localhost:4572/testcases/umbrella-home/ui-preview/?workspaceId=workspace_qa&projectId=project_qa&view=runs&runId=run_qa" },
    get localStorage() { if (blockedStorage) throw new Error("Storage blocked"); return storage; },
  } });
  let root!: ReactTestRenderer, refreshes = 0;
  let props: SummaryProps = { scope, ru: false, state: { items, ready: true, error: null,
    loading: false, next: null, aiEnabled: true, more: async () => {}, refresh: async () => { refreshes++; } } };
  let subject = "qa-reviewer";
  const view = () => <TmsSessionProvider value={{ kind: "managed", label: "QA", subject, signOut: async () => {} }}><Summary {...props} /></TmsSessionProvider>;
  const render = () => act(() => { root = create(view()); });
  render();
  t.after(() => {
    act(() => root.unmount());
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
  });
  return { storage, get root() { return root; }, refreshes: () => refreshes,
    update: (next: SummaryUpdate, nextSubject = subject) => {
      props = { ...props, ...next, state: next.state ? { ...props.state, ...next.state } : props.state }; subject = nextSubject; act(() => root.update(view()));
    },
    proposals: (next: ImpactAnalysis[]) => { props = { ...props, state: { ...props.state, items: next } }; act(() => root.update(view())); },
    remount: () => { act(() => root.unmount()); render(); },
    dismiss: (index = 0) => {
      const button = root.root.findAllByType("button").filter(node => String(node.props["aria-label"]).startsWith("Dismiss analysis proposal"))[index];
      assert.ok(button, "each proposal has an accessible dismissal action"); act(() => button.props.onClick());
    },
  };
}

test("run proposals keep exact scope evidence behind a closed disclosure and retain the review destination", t => {
  const item = analysis({ scope: [
    { testCaseId: "one", included: true, origin: "falcon" }, { testCaseId: "two", included: false, origin: "manual" },
  ], approvalBlockedReasons: ["BUILD_NOT_SUCCESSFUL"], result: {
    summary: "Authorization changes affect invitation and access checks.", riskLevel: "high", impactedAreas: [],
    selectedTestCases: [], coverageGaps: [], notes: [],
    ai: { status: "complete", provider: "test", model: "test", promptVersion: "1", schemaVersion: "1", inputTokens: 1, outputTokens: 1, cost: null, latencyMs: 1, candidateCount: 2 },
  } });
  const f = fixture(t, [item]);
  const details = f.root.root.findAllByType("details"); assert.equal(details.length, 1);
  assert.notEqual(details[0].props.open, true);
  const text = JSON.stringify(details[0].findAllByType("p").map(node => node.children));
  assert.ok(text.includes(item.result!.summary));
  assert.ok(details[0].findAllByType("p").some(node => node.children.join("").includes("Tests in scope: 1")));
  assert.ok(details[0].findAllByType("li").some(node => node.children.join("").includes("Wait for a successful build")));
  const destination = new URL(f.root.root.findByType("a").props.href);
  assert.equal(destination.pathname, "/testcases/umbrella-home/ui-preview/");
  assert.equal(destination.searchParams.get("analysisId"), item.id);
  assert.equal(destination.searchParams.get("workspaceId"), scope.workspaceId);
});

test("dismissal persists after reload for one proposal while other proposals remain visible", t => {
  const first = analysis(), second = analysis({ id: "analysis_other" });
  const f = fixture(t, [first, second]); f.dismiss();
  assert.equal(f.root.root.findAllByType("a").length, 1);
  assert.equal(new URL(f.root.root.findByType("a").props.href).searchParams.get("analysisId"), second.id);
  f.remount(); assert.equal(f.root.root.findAllByType("a").length, 1);
  assert.equal(first.approved, false); assert.equal(first.rowVersion, 7);
});

test("new analysis, proposal revision, run and account contexts are never hidden by an earlier dismissal", t => {
  const item = analysis(), f = fixture(t, [item]); f.dismiss(); assert.equal(f.root.toJSON(), null);
  for (const next of [analysis({ id: "analysis_new" }), analysis({ rowVersion: 8 }), analysis({ runId: "run_new" }),
    analysis({ change: { ...item.change, sha: "c".repeat(40) } })]) {
    f.proposals([next]); assert.equal(f.root.root.findAllByType("a").length, 1);
  }
  f.proposals([item]); assert.equal(f.root.toJSON(), null);
  f.update({}, "another-reviewer"); assert.equal(f.root.root.findAllByType("a").length, 1);
  f.update({}, "qa-reviewer"); assert.equal(f.root.toJSON(), null);
});

test("blocked storage still permits dismissal in the current view", t => {
  const f = fixture(t, [analysis()], true); f.dismiss(); assert.equal(f.root.toJSON(), null);
});

test("loading and empty results stay quiet; failures retain Retry and Russian approval copy", async t => {
  const f = fixture(t);
  f.update({ state: { items: [], ready: false, error: null } });
  assert.equal(f.root.toJSON(), null);
  f.update({ state: { items: [], ready: true, error: null } });
  assert.equal(f.root.toJSON(), null);
  f.update({ state: { items: [], ready: false, error: "Failed" } });
  assert.equal(f.root.toJSON(), null);
  const toast = f.root.root.findByType(ErrorToast);
  assert.equal(toast.props.retryLabel, "Retry");
  await act(async () => toast.props.onRetry()); assert.equal(f.refreshes(), 1);
  f.proposals([analysis({ approved: true })]);
  f.update({ ru: true, state: { items: [analysis({ approved: true })], ready: true, error: null } });
  assert.ok(JSON.stringify(f.root.toJSON()).includes("Состав подтверждён QA"));
  assert.ok(f.root.root.findAllByType("button").some(node => String(node.props["aria-label"]).startsWith("Скрыть предложение анализа")));
});
