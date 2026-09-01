export type CasePageMeta = {
  hasMore: boolean;
  nextCursor: string | null;
};
export type CaseCursorPage<T> = { items: T[]; meta: CasePageMeta };
export type CasePageWindow<T> = {
  items: T[];
  nextCursor: string | null;
  requestedCursors: Set<string>;
  loadedPageCount: number;
};

export class CasePaginationContractError extends Error {}

export function nextCasePageCursor(
  meta: CasePageMeta,
  requestedCursors: ReadonlySet<string>,
) {
  if (!meta.hasMore) return null;
  if (!meta.nextCursor) {
    throw new CasePaginationContractError("Case collaboration pagination omitted its cursor.");
  }
  if (requestedCursors.has(meta.nextCursor)) {
    throw new CasePaginationContractError(
      "Case collaboration pagination returned a repeated cursor.",
    );
  }
  return meta.nextCursor;
}

export function appendUniqueCasePage<T>(
  current: readonly T[],
  incoming: readonly T[],
  keyOf: (item: T) => string,
) {
  const seen = new Set(current.map(keyOf));
  const result = [...current];
  for (const item of incoming) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export async function loadCasePageWindow<T>(
  load: (cursor: string | null, signal: AbortSignal) => Promise<CaseCursorPage<T>>,
  pageCount: number,
  keyOf: (item: T) => string,
  signal: AbortSignal,
): Promise<CasePageWindow<T>> {
  const requestedCursors = new Set<string>();
  let items: T[] = [];
  let cursor: string | null = null;
  let nextCursor: string | null = null;
  let loadedPageCount = 0;
  for (let index = 0; index < Math.max(1, pageCount); index += 1) {
    signal.throwIfAborted();
    if (cursor) requestedCursors.add(cursor);
    const page = await load(cursor, signal);
    items = appendUniqueCasePage(items, page.items, keyOf);
    loadedPageCount += 1;
    nextCursor = nextCasePageCursor(page.meta, requestedCursors);
    if (!nextCursor) break;
    cursor = nextCursor;
  }
  return { items, nextCursor, requestedCursors, loadedPageCount };
}
