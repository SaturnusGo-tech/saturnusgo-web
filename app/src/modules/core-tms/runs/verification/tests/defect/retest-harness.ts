import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import { createTmsHttpClient, TmsApiError } from "../../../../../../core/tms/transport/http";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import { createVerificationRunStarter } from "../../application/verification-run-starter";
import { getVerificationQueue } from "../../data/verification-api";
import type { useDefectRetest } from "../../state/defect/useDefectRetest";
import { queue, run } from "../fixtures/verification-fixture";

export const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
export function gate<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((release) => { resolve = release; });
  return { promise, resolve };
}
export const response = (value: unknown) => new Response(JSON.stringify(value), { headers: { etag: '"run-new:v1"' } });
export interface RequestLog { url: URL; method: string; body: Record<string, unknown> | null; key: string | null; signal: AbortSignal | undefined }
export function retestHarness(handler?: (request: RequestLog, index: number) => Response | Promise<Response>) {
  const h = componentHarness(); const requests: RequestLog[] = []; const navigated: [string, string | null][] = [];
  const etags: (string | null)[] = []; const writes: unknown[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "qa-token",
    fetch: (async (url, init) => {
      const request: RequestLog = { url: new URL(String(url)), method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : null,
        key: new Headers(init?.headers).get("Idempotency-Key"), signal: init?.signal ?? undefined };
      requests.push(request);
      return handler ? handler(request, requests.length) : response(request.method === "GET" ? queue : { data: run });
    }) as typeof fetch });
  const loaded = h.load<{ useDefectRetest: typeof useDefectRetest }>(new URL("../../state/defect/useDefectRetest.ts", import.meta.url), name => {
    if (name.endsWith("useTmsHttpClient") || name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru" }) };
    if (name.endsWith("verification-run-starter")) return { createVerificationRunStarter };
    if (name.endsWith("verification-api")) return { getVerificationQueue };
    if (name.endsWith("transport/http")) return { TmsApiError };
    return undefined;
  });
  const input = { defect: { id: "bug-1", key: "BUG-1", projectId: "project-1", status: "ready_for_retest",
    runId: "origin-completed", runItemId: "origin-passed-item" } as Defect };
  const data = { workspace: { id: "workspace-1" }, meta: { authorization: { capabilities: ["defect:read", "run:read", "run:manage", "run:execute"] } },
    runs: [{ ...run, id: "origin-completed", status: "completed" }] };
  const state = { data, connection: "connected", view: "reports",
    setData(update: (current: typeof data) => typeof data) { state.data = update(state.data); writes.push(state.data); },
    setSelectedRunEtag(value: string | null) { etags.push(value); } };
  const derived = { project: { id: "project-1" }, projectEnvironments: [
    { id: "env-default", name: "Default QA", status: "active", isDefault: true },
    { id: "env-1", name: "Source QA", status: "active", isDefault: false },
    { id: "env-archived", name: "Archived", status: "archived", isDefault: false },
  ], projectRuns: [{ ...run, id: "origin-completed", status: "completed" }] };
  const render = () => h.render(() => loaded.useDefectRetest(state as unknown as Parameters<typeof useDefectRetest>[0],
    derived as unknown as Parameters<typeof useDefectRetest>[1], input.defect, (id, itemId) => { navigated.push([id, itemId]); }));
  function prepare(build = "  build-fixed-42  ") { render().open(); render().setBuild(build); return render(); }
  return { h, state, derived, input, render, prepare, requests, navigated, writes, etags };
}
