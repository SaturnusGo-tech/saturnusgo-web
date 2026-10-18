export function reviewPage<T>(items: readonly T[], query: string, requestedPage: number, text: (item: T) => string) {
  const search = query.trim().toLocaleLowerCase();
  const matches = search ? items.filter((item) => text(item).toLocaleLowerCase().includes(search)) : items;
  const pages = Math.max(1, Math.ceil(matches.length / 10));
  const page = Math.min(pages, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const offset = (page - 1) * 10;
  return { items: matches.slice(offset, offset + 10), total: matches.length, page, pages,
    start: matches.length ? offset + 1 : 0, end: Math.min(offset + 10, matches.length) };
}
