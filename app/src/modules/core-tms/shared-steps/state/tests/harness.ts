import { componentHarness } from "../../../portfolios/tests/support/component-harness";
import type { SharedStep, SharedStepDraft, SharedStepSummary } from "../../model/shared-step";
import type { useSharedSteps } from "../useSharedSteps";

export const draft: SharedStepDraft = { title: "Authentication", items: [], changeNote: "", folderId: null };
export const shared = (id: string, projectId = "a", revision = 1): SharedStep => ({
  id, projectId, folderId: null, folderPath: "/", currentRevision: revision, revisionCount: revision,
  current: { title: id, revision, items: [], changeNote: "", createdBy: "qa", createdAt: "2026-11-13" },
  archivedAt: null, createdAt: "2026-11-13", updatedAt: "2026-11-13", etag: `"${id}:${revision}"`,
});
export const summary = (id: string, projectId = "a"): SharedStepSummary => ({
  ...shared(id, projectId), title: id, itemCount: 0, usageCount: 0,
});
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
export function stateHarness(overrides: Record<string, unknown> = {}) {
  const h = componentHarness(undefined, { DOMException });
  const api = { listSharedSteps: async () => [] as SharedStepSummary[],
    getSharedStep: async (_http: unknown, projectId: string, id: string) => shared(id, projectId),
    createSharedStep: async (_http: unknown, projectId: string) => shared("created", projectId, 2),
    reviseSharedStep: async (_http: unknown, current: SharedStep) => shared(current.id, current.projectId, 2),
    ...overrides };
  const { useSharedSteps: hook } = h.load<{ useSharedSteps: typeof useSharedSteps }>(new URL("../useSharedSteps.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => api };
    if (name.endsWith("shared-step-api")) return api;
    return undefined;
  });
  let project = "a";
  let connection: "connected" | "demo" = "connected";
  let folders: Parameters<typeof useSharedSteps>[2];
  return { render: () => h.render(() => hook(project, connection, folders)),
    context: (next: string, mode = connection, catalog = folders) => { project = next; connection = mode; folders = catalog; }, dispose: h.dispose };
}
