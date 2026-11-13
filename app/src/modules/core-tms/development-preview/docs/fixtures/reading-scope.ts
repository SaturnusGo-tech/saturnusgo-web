import type { ProductDocScope } from "../../../product-docs/domain/product-docs";

export const readingScope: ProductDocScope = { workspaceId: "preview", projectId: "host" };

export function assertReadingScope(scope: ProductDocScope, signal?: AbortSignal): void {
  signal?.throwIfAborted();
  if (scope.workspaceId !== readingScope.workspaceId || scope.projectId !== readingScope.projectId) {
    throw Object.assign(new Error("Local preview scope only"), { status: 404, code: "PRODUCT_DOC_NOT_FOUND" });
  }
}
