import type { ProductDocScope, ProductDocSelection } from "../domain/product-docs";
import { readScopedProductDocLink } from "./product-doc-link";

export type ProductDocSmartTarget =
  | { kind: "case"; id: string }
  | ({ kind: "document"; id: string } & Omit<ProductDocSelection, "docId">)
  | { kind: "external"; url: string };

export function readProductDocSmartTarget(href: string, current: string, scope: ProductDocScope): ProductDocSmartTarget | null {
  if (href.trimStart().startsWith("#")) return null;
  try {
    const base = new URL(current);
    const url = new URL(href, base);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
    if (url.origin !== base.origin) return { kind: "external", url: url.href };
    const selection = readScopedProductDocLink(href, current, scope);
    if (selection) {
      const {docId: id, ...position} = selection;
      return {kind: "document", id, ...position};
    }
    if (url.pathname !== base.pathname && !/^\/(?:testcases\/umbrella-home\/)?work\/?$/.test(url.pathname)) return null;
    if (url.searchParams.get("workspaceId") !== scope.workspaceId || url.searchParams.get("projectId") !== scope.projectId) return null;
    const id = url.searchParams.get("caseId");
    return id && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id) ? {kind: "case", id} : null;
  } catch {
    return null;
  }
}
