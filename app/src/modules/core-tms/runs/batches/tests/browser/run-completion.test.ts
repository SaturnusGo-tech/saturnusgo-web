import assert from "node:assert/strict";
import test from "node:test";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import { resolvePendingOperation } from "../../../../../../core/tms/idempotency/pending-operation";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import { nextRunAfterFinish } from "../../../model/history/run-history";
import type { useRunBrowser } from "../../state/browser/useRunBrowser";
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
const run = (id: string, status: TestRunSummary["status"]) => ({ id, status, projectId: "p", archivedAt: null,
  createdAt: id === "current" ? "2026-09-13" : "2026-09-12", name: id } as TestRunSummary);
function fixture(remaining: TestRunSummary[] = []) {
  const h = componentHarness(); const finished: (TestRunSummary | null)[] = []; let refreshes = 0;
  const current = run("current", "active"); const updates: TestRunSummary[][] = [];
  let transition: () => Promise<{ data: TestRunSummary }> = async () => ({ data: run("current", "completed") });
  const input = { workspaceId: "w", selected: current as TestRunSummary | null, selectedId: "current", knownRuns: [current, ...remaining],
    connected: true, ru: true, onUpdate: (runs: TestRunSummary[]) => { updates.push(runs); },
    onRefreshSelected: () => { refreshes++; }, onFinished: (next: TestRunSummary | null) => { finished.push(next); } };
  const { useRunBrowser: useBrowser } = h.load<{ useRunBrowser: typeof useRunBrowser }>(new URL("../../state/browser/useRunBrowser.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
    if (name.endsWith("run-history")) return { nextRunAfterFinish };
    if (name.endsWith("pending-operation")) return { resolvePendingOperation };
    if (name.endsWith("transport/http")) return { TmsApiError };
    if (name.endsWith("batch-api")) return { listRunBatches: async () => [] };
    if (name.endsWith("run-api")) return { listRunItems: async () => ({ items: [] }),
      getRun: async () => ({ data: current, etag: '"v1"' }), transitionRun: () => transition() };
    if (name.endsWith("mutation-failure")) return { toTmsMutationFailure: () => ({ code: "CONFLICT" }), formatTmsMutationFailure: (_error: unknown, text: string) => text };
    return undefined;
  });
  const http = {};
  const render = () => h.render(() => useBrowser(input));
  const prepare = async () => { render(); await tick(); render(); await tick(); return render(); };
  return { h, input, finished, updates, render, prepare, refreshes: () => refreshes,
    transition: (value: typeof transition) => { transition = value; } };
}

test("confirmed completion updates history then chooses the next run; the last run clears selection", async () => {
  for (const remaining of [[], [run("next", "draft"), run("old", "completed")]]) {
    const f = fixture(remaining); await (await f.prepare()).act("complete");
    assert.equal(f.updates[0][0].status, "completed");
    assert.equal(f.finished.length, 1); assert.equal(f.finished[0]?.id ?? null, remaining[0]?.id ?? null);
    assert.equal(f.refreshes(), 0); f.h.dispose();
  }
});

test("rejected completion leaves current selection and history unchanged", async () => {
  const f = fixture([run("next", "draft")]); f.transition(async () => { throw new Error("Rejected"); });
  await (await f.prepare()).act("complete");
  assert.equal(f.finished.length, 0); assert.equal(f.updates.length, 0); assert.ok(f.render().error); f.h.dispose();
});

test("a late completion response cannot redirect a user who selected another run", async () => {
  const f = fixture([run("next", "draft")]); let release!: (value: { data: TestRunSummary }) => void;
  f.transition(() => new Promise(resolve => { release = resolve; }));
  const pending = (await f.prepare()).act("complete"); await tick();
  f.input.selected = run("next", "draft"); f.input.selectedId = "next"; f.render();
  release({ data: run("current", "completed") }); await pending;
  assert.equal(f.finished.length, 0); assert.equal(f.updates.length, 0); f.h.dispose();
});
