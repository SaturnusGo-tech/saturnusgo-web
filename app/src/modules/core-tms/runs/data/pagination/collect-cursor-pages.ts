type PageMeta = {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
};

type CursorPage<T, Meta extends PageMeta> = {
  data: T[];
  meta: Meta;
};

type CursorPageOptions = {
  maxItems: number;
  maxPages: number;
  resourceLabel: string;
  signal?: AbortSignal;
};

export async function collectCursorPages<T, Meta extends PageMeta>(
  loadPage: (cursor: string | null) => Promise<CursorPage<T, Meta>>,
  options: CursorPageOptions,
) {
  const items: T[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  for (let page = 0; page < options.maxPages; page += 1) {
    options.signal?.throwIfAborted();
    const result = await loadPage(cursor);
    items.push(...result.data);
    if (items.length > options.maxItems ||
        (items.length >= options.maxItems && result.meta.hasMore)) {
      throw new Error(`${options.resourceLabel} exceeds the supported ${options.maxItems.toLocaleString("en-US")}-item limit.`);
    }
    if (!result.meta.hasMore || !result.meta.nextCursor) {
      return { items, meta: result.meta };
    }
    if (seenCursors.has(result.meta.nextCursor)) {
      throw new Error(`${options.resourceLabel} pagination returned a repeated cursor.`);
    }
    seenCursors.add(result.meta.nextCursor);
    cursor = result.meta.nextCursor;
  }

  throw new Error(`${options.resourceLabel} exceeds the supported ${options.maxPages}-page limit.`);
}
