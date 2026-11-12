import type { ProductDocScope, ProductDocSelection } from "../domain/product-docs";
import { readScopedProductDocLink } from "./product-doc-link";

export type ProductDocSmartTarget =
  | { kind: "case"; id: string; projectId?: string }
  | ({ kind: "document"; id: string } & Omit<ProductDocSelection, "docId">)
  | ProductDocRepositoryTarget
  | { kind: "external"; url: string };

export type ProductDocRepositoryTarget = { kind: "repository"; projectId: string; folderId?: string; folderPath?: string };
const identifier = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function repositoryPath(value: string) {
  const path = value.replace(/^\/+|\/+$/g, "");
  return path && path.length <= 2048 && !/[\u0000-\u001f\\]/.test(path)
    && path.split("/").every(part => part.trim() && part !== "." && part !== "..") ? path : undefined;
}

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
    for (const key of ["workspaceId", "projectId", "caseId", "folderId", "folderPath", "view"]) {
      if (url.searchParams.getAll(key).length > 1) return null;
    }
    const projectId = url.searchParams.get("projectId");
    if (url.searchParams.get("workspaceId") !== scope.workspaceId || !projectId || !identifier.test(projectId)) return null;
    const id = url.searchParams.get("caseId");
    if (id) return identifier.test(id) ? {kind: "case", id, ...(projectId !== scope.projectId ? {projectId} : {})} : null;
    if (url.searchParams.get("view") !== "cases" || url.searchParams.has("docId")) return null;
    const folderId = url.searchParams.get("folderId");
    const path = url.searchParams.get("folderPath");
    if (folderId) return identifier.test(folderId) ? {kind: "repository", projectId, folderId} : null;
    const folderPath = path && repositoryPath(path);
    return folderPath ? {kind: "repository", projectId, folderPath} : null;
  } catch {
    return null;
  }
}
