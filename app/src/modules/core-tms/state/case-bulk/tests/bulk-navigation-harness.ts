import type { Bootstrap, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import * as failure from "../../../../../core/tms/errors/mutation-failure";
import * as pendingOperation from "../../../../../core/tms/idempotency/pending-operation";
import * as contract from "../../../../../core/tms/contracts/test-cases/bulk-case-contract";
import * as api from "../../../test-cases/data/bulk/test-case-bulk-api";
import * as reconciliation from "../reconciliation/reconcileCaseSummaries";
import { createWorkspaceRequests } from "../../workspace/requests/workspace-requests";
import { hookHarness } from "../../navigation/browser/tests/project/hook-harness";
import type { useCaseBulkActions } from "../useCaseBulkActions";

type Write = { input: api.BulkCaseMutationInput; key: string; resolve: (value: { data: api.BulkCaseMutation }) => void; reject: (error: Error) => void };
export function bulkNavigationHarness() {
  const h = hookHarness("https://tms.example/work/?workspaceId=w&projectId=a&view=cases");
  const requests = createWorkspaceRequests();
  const writes: Write[] = [];
  const refreshes: string[] = [];
  const notices: string[] = [];
  const detailRetries: string[] = [];
  let dataWrites = 0;
  const item = { id: "case-a", key: "A-1", projectId: "a", etag: '"case-a:1"', currentRevision: 1, revisionCount: 1,
    lifecycle: "draft", priority: "low", archivedAt: null } as TestCaseSummary;
  const state = {
    data: { workspace: { id: "w" }, testCases: [item] } as Bootstrap,
    selectedCaseId: item.id, connection: "connected", view: "cases",
    captureProjectNavigationGuard: requests.captureNavigationGuard,
    async loadProject(projectId: string) { const lease = requests.beginNavigation(); refreshes.push(`navigation:${projectId}`); lease.finish(); return {}; },
    async refreshProject(projectId: string) {
      const lease = requests.beginRefresh(projectId);
      if (!lease) return null;
      refreshes.push(`background:${projectId}`); lease.finish(); return {};
    },
    setData(update: (current: Bootstrap) => Bootstrap) { dataWrites++; state.data = update(state.data); },
    retrySelectedCaseDetail() { detailRetries.push(state.selectedCaseId); },
  };
  const derived = { project: { id: "a" }, projectCases: [item] };
  const http = { mutateResource: (_path: string, _method: string, input: api.BulkCaseMutationInput, options: { idempotencyKey: string }) =>
    new Promise<{ data: api.BulkCaseMutation }>((resolve, reject) => writes.push({ input, key: options.idempotencyKey, resolve, reject })) };
  const hook = h.load<{ useCaseBulkActions: typeof useCaseBulkActions }>(new URL("../useCaseBulkActions.ts", import.meta.url), (name) => {
    if (name.endsWith("mutation-failure")) return failure;
    if (name.endsWith("pending-operation")) return pendingOperation;
    if (name.endsWith("bulk-case-contract")) return contract;
    if (name.endsWith("test-case-bulk-api")) return api;
    if (name.endsWith("reconcileCaseSummaries")) return reconciliation;
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    throw new Error(name);
  }).useCaseBulkActions;
  function render() {
    return h.render(() => hook(state as unknown as Parameters<typeof hook>[0], derived as unknown as Parameters<typeof hook>[1], (message) => notices.push(message)));
  }
  function succeed(index = 0) {
    writes[index].resolve({ data: { updatedCount: 1, unchangedCount: 0, items: [{ id: item.id, key: item.key, currentRevision: 2,
      lifecycle: "draft", priority: "high", updatedAt: "2026-09-09T15:00:00Z", etag: '"case-a:2"', changed: true }] } });
  }
  return { h, requests, state, derived, writes, refreshes, notices, detailRetries, render, succeed, dataWrites: () => dataWrites };
}
