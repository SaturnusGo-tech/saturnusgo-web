import type { ProductDocScope, ProductDocSelection } from "../domain/product-docs";

const safeId = /^[A-Za-z0-9_-]{1,128}$/;

export function readProductDocSelection(href: string): ProductDocSelection | undefined {
  const params = new URL(href).searchParams;
  const docId = params.get("docId");
  if (params.get("view") !== "product-docs" || !docId || !safeId.test(docId)) return undefined;
  const sectionId = params.get("docSection");
  const rawVersion = params.get("docVersion");
  const version = rawVersion && /^[1-9]\d{0,9}$/.test(rawVersion) ? Number(rawVersion) : undefined;
  if (rawVersion !== null && (!version || version > 2147483647)) return undefined;
  return {
    docId,
    ...(version !== undefined ? {version} : {}),
    ...(sectionId && safeId.test(sectionId) ? {sectionId} : {}),
  };
}

export function writeProductDocSelection(url: URL, selection?: ProductDocSelection): URL {
  for (const name of ["docId", "docVersion", "docSection"]) url.searchParams.delete(name);
  if (!selection) return url;
  url.searchParams.set("docId", selection.docId);
  if (selection.version !== undefined) url.searchParams.set("docVersion", String(selection.version));
  if (selection.sectionId) url.searchParams.set("docSection", selection.sectionId);
  return url;
}

export function readScopedProductDocLink(href: string, current: string, scope: ProductDocScope) {
  try {
    const base = new URL(current);
    const target = new URL(href, base);
    if (!/^https?:$/.test(target.protocol) || target.origin !== base.origin || target.username || target.password) return undefined;
    if (target.pathname !== base.pathname && !/^\/(?:testcases\/umbrella-home\/)?work\/?$/.test(target.pathname)) return undefined;
    if (target.searchParams.get("workspaceId") !== scope.workspaceId || target.searchParams.get("projectId") !== scope.projectId) return undefined;
    const selection = readProductDocSelection(target.href);
    if (target.searchParams.has("docSection") && !selection?.sectionId) return undefined;
    return selection;
  } catch {
    return undefined;
  }
}
