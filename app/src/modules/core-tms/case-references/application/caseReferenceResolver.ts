import type { CaseReference, CaseReferenceScope } from "../domain/caseReference";

type KnownCase = CaseReference & { readonly archivedAt?: string | null };
type Find = (projectId: string, key: string, signal: AbortSignal) => Promise<CaseReference[] | null>;
type Entry = { value: CaseReference | null; expires: number };
type Job = { key: string; done: (value: CaseReference | null) => void };

/** Per mounted authorized scope: no shared cache can leak titles between companies or sessions. */
export function createCaseReferenceResolver(scope: CaseReferenceScope, records: readonly KnownCase[],
  projectIds: readonly string[], find: Find) {
  const known = new Map<string, CaseReference | null>();
  for (const record of records) {
    if (record.projectId !== scope.projectId || !record.title.trim()) continue;
    known.set(record.key, known.has(record.key) ? null : record);
  }
  const projects = [...new Set(projectIds)].filter(id => id && id !== scope.projectId);
  const cache = new Map<string, Entry>();
  const pending = new Map<string, Promise<CaseReference | null>>();
  const queue: Job[] = [];
  const controller = new AbortController();
  let running = 0;

  function peek(key: string): CaseReference | null | undefined {
    if (known.has(key)) return known.get(key);
    const entry = cache.get(key);
    return entry && entry.expires > Date.now() ? entry.value : undefined;
  }
  async function lookup(key: string): Promise<CaseReference | null> {
    const current = await find(scope.projectId, key, controller.signal);
    if (!current || current.length > 1) return null;
    if (current.length === 1) return current[0];
    if (projects.length > 64) return null;
    let match: CaseReference | null = null;
    for (const projectId of projects) {
      const result = await find(projectId, key, controller.signal);
      if (!result || result.length > 1 || (result.length && match)) return null;
      if (result.length) match = result[0];
    }
    return match;
  }
  function drain() {
    while (!controller.signal.aborted && running < 4 && queue.length) {
      const job = queue.shift()!;
      running += 1;
      void lookup(job.key).catch(() => null).then(value => {
        if (!controller.signal.aborted) {
          if (cache.size >= 256) cache.delete(cache.keys().next().value!);
          cache.set(job.key, { value, expires: Date.now() + (value ? 60_000 : 15_000) });
        }
        pending.delete(job.key);
        job.done(controller.signal.aborted ? null : value);
      }).finally(() => { running -= 1; drain(); });
    }
  }
  function resolve(key: string): Promise<CaseReference | null> {
    const ready = peek(key);
    if (ready !== undefined || controller.signal.aborted) return Promise.resolve(ready ?? null);
    const existing = pending.get(key);
    if (existing) return existing;
    if (pending.size >= 256) return Promise.resolve(null);
    const promise = new Promise<CaseReference | null>(done => queue.push({ key, done }));
    pending.set(key, promise);
    drain();
    return promise;
  }
  return { peek, resolve, dispose() {
    controller.abort();
    for (const job of queue.splice(0)) job.done(null);
    pending.clear(); cache.clear(); known.clear();
  } };
}

export type CaseReferenceResolver = ReturnType<typeof createCaseReferenceResolver>;
