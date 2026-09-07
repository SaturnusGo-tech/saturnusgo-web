import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { getRun, transitionRun } from "../../../runs/data/run-api";

type Resource = Awaited<ReturnType<typeof getRun>>;
type Input = { run: TestRunSummary; projectId: string; connected: boolean;
  canManage: boolean; etag: string | null; signal?: AbortSignal };

export function canStartDraftRun(input: Omit<Input, "etag" | "signal">) {
  return input.connected && input.canManage && input.run.projectId === input.projectId
    && input.run.status === "draft" && !input.run.archivedAt && input.run.itemCount > 0;
}

export function createDraftRunStarter(http: TmsHttpClient,
  createKey: () => string = () => crypto.randomUUID()) {
  const pending = new Map<string, { etag: string; key: string }>();
  const active = new Map<string, Promise<Resource>>();
  function validate(resource: Resource, input: Input) {
    input.signal?.throwIfAborted();
    if (resource.data.id !== input.run.id || resource.data.projectId !== input.projectId
      || resource.data.archivedAt || !resource.etag) throw new Error("Run scope or ETag mismatch.");
    return resource;
  }
  async function execute(input: Input, target: string): Promise<Resource> {
    input.signal?.throwIfAborted();
    let operation = pending.get(target);
    if (!operation) {
      const current = input.etag ? { data: input.run, etag: input.etag }
        : validate(await getRun(http, input.run.id, input.signal), input);
      if (current.data.status === "active") return current;
      if (!canStartDraftRun({ ...input, run: current.data })) throw new Error("Run is not a draft.");
      operation = { etag: current.etag!, key: createKey() };
      pending.set(target, operation);
    }
    for (let attempt = 0; ; attempt += 1) {
      try {
        const started = validate(await transitionRun(http, input.run.id, "start",
          operation.etag, operation.key, undefined, input.signal), input);
        if (started.data.status !== "active") throw new Error("Run did not start.");
        pending.delete(target);
        return started;
      } catch (error) {
        if (!(error instanceof TmsApiError) || error.status !== 412 || attempt > 0) throw error;
        pending.delete(target);
        const current = validate(await getRun(http, input.run.id, input.signal), input);
        if (current.data.status === "active") return current;
        if (!canStartDraftRun({ ...input, run: current.data })) throw error;
        operation = { etag: current.etag!, key: createKey() };
        pending.set(target, operation);
      }
    }
  }
  return Object.freeze({
    start(input: Input): Promise<Resource> {
      if (!canStartDraftRun(input)) return Promise.reject(new Error("Run start is unavailable."));
      const target = JSON.stringify([input.projectId, input.run.id]);
      const existing = active.get(target);
      if (existing) return existing;
      const request = execute(input, target).finally(() => active.delete(target));
      active.set(target, request);
      return request;
    },
  });
}
