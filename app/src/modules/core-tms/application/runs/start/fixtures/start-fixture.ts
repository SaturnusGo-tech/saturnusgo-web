import type { components } from "../../../../../../core/tms/generated/tms-api";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import { mapRun } from "../../../../runs/data/run-mapper";

export const dto: components["schemas"]["Run"] = {
  id: "run-1", projectId: "project-1", key: "QA-TR-1", name: "Source checks", description: "",
  type: "smoke", status: "draft", environment: { id: "env-1", key: "QA", name: "QA",
    baseUrl: "https://qa.example.test", variableKeys: [] },
  suiteId: null, suiteResolutionId: null, build: "sha-a", configuration: {}, itemCount: 1,
  progress: { total: 1, executed: 0, percent: 0,
    counts: { not_run: 1, in_progress: 0, passed: 0, failed: 0, blocked: 0, skipped: 0 } },
  attachmentIds: [], createdBy: "identity-1", startedAt: null, completedAt: null,
  abortedAt: null, abortReason: null, archivedAt: null, archivedBy: null, archiveReason: null,
  createdAt: "2026-09-07T00:00:00Z", updatedAt: "2026-09-07T00:00:00Z",
};
export const input = { run: mapRun(dto), projectId: "project-1", connected: true,
  canManage: true, etag: '"run-1:1"' };
export type Call = { path: string; method: string; etag: string | null; key: string | null;
  contentType: string | null; body: BodyInit | null | undefined };
export function response(run = dto, etag: string | null = '"run-1:2"') {
  return new Response(JSON.stringify({ data: run }), {
    status: 200, headers: etag ? { etag } : undefined,
  });
}
export const active = () => response({ ...dto, status: "active", startedAt: dto.createdAt });
export function stale() {
  return new Response(JSON.stringify({ error: {
    code: "PRECONDITION_FAILED", message: "The run changed", requestId: "request-stale",
  } }), { status: 412 });
}
export function transport(replies: Array<() => Response | Promise<Response>>) {
  const calls: Call[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "synthetic-token", production: false,
    fetch: (async (url, init = {}) => {
      const headers = new Headers(init.headers);
      calls.push({ path: new URL(String(url)).pathname, method: String(init.method),
        etag: headers.get("if-match"), key: headers.get("idempotency-key"),
        contentType: headers.get("content-type"), body: init.body });
      const next = replies.shift();
      if (!next) throw new Error("Unexpected HTTP request");
      return next();
    }) as typeof fetch });
  return { http, calls };
}
