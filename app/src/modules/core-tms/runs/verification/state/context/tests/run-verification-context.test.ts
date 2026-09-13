import assert from "node:assert/strict";
import test from "node:test";
import type { RunItem, TestRunSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import { componentHarness } from "../../../../../portfolios/tests/support/component-harness";
import { collectRunVerification } from "../../../application/collect-verification-entries";
import { entry, run } from "../../../tests/fixtures/verification-fixture";
import { gate, tick } from "../../../tests/defect/retest-harness";
import type { useRunVerificationContext } from "../useRunVerificationContext";
import type { VerificationRunEnvelope } from "../../../model/verification";

function fixture() {
  const h = componentHarness(); const requests: { runId: string; caseId: string; signal: AbortSignal; reply: ReturnType<typeof gate<VerificationRunEnvelope>> }[] = [];
  const http = {};
  const { useRunVerificationContext: hook } = h.load<{ useRunVerificationContext: typeof useRunVerificationContext }>(new URL("../useRunVerificationContext.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
    if (name.endsWith("collect-verification-entries")) return { collectRunVerification };
    if (name.endsWith("verification-api")) return { getRunVerification: (_http: unknown, runId: string, caseId: string, _offset: number, signal: AbortSignal) => {
      const reply = gate<VerificationRunEnvelope>(); requests.push({ runId, caseId, signal, reply }); return reply.promise;
    } };
    return undefined;
  });
  const input = { run: { ...run } as TestRunSummary, item: { id: "item-new", caseId: "case-1", status: "passed" } as RunItem, connected: true };
  const render = () => h.render(() => hook(input.run, input.item, input.connected));
  const page = (itemId: string, caseId = "case-1"): VerificationRunEnvelope => ({ data: [
    { ...entry, runItemId: itemId, caseId, currentStatus: "ready_for_retest", readinessChanged: false },
  ], meta: { offset: 0, limit: 50, hasMore: false, nextOffset: null } });
  return { h, input, render, requests, page };
}

test("only verification runs request the current case and retain exact run-item entries", async () => {
  const f = fixture(); f.input.run.configuration = {}; assert.equal(f.render().enabled, false); assert.equal(f.requests.length, 0);
  f.input.run.configuration = { fixVerificationScope: "a".repeat(64) }; f.render();
  assert.equal(f.requests[0].runId, run.id); assert.equal(f.requests[0].caseId, "case-1");
  f.requests[0].reply.resolve({ ...f.page("item-new"), data: [
    ...f.page("origin-item").data, ...f.page("item-new", "foreign-case").data, ...f.page("item-new").data,
  ] }); await tick();
  const state = f.render(); assert.equal(state.items.length, 1); assert.equal(state.items[0].runItemId, "item-new");
  f.h.dispose();
});

test("selection changes abort old context and late data never replaces the new case", async () => {
  const f = fixture(); f.render();
  f.input.item = { ...f.input.item, id: "second-item", caseId: "case-2" }; f.render();
  assert.equal(f.requests[0].signal.aborted, true); assert.equal(f.requests[1].caseId, "case-2");
  f.requests[1].reply.resolve(f.page("second-item", "case-2")); await tick();
  f.requests[0].reply.resolve(f.page("item-new")); await tick();
  const state = f.render(); assert.deepEqual(state.items.map(value => value.caseId), ["case-2"]); f.h.dispose();
});
