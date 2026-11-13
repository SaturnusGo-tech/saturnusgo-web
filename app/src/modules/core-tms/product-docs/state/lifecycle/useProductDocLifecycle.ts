import { useCallback, useMemo, useRef } from "react";
import type { TmsLocale } from "../../../localization/model/locale";
import type { ProductDocLifecycleContext } from "./product-doc-lifecycle-context";
import type { ProductDocNode, ProductDocScope, ProductDocSelection, ProductDocsApi } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { productDocDraftKey, type ProductDocDraftBuffer } from "../draft/draft-buffer";

export function useProductDocLifecycle(input: {
  api: ProductDocsApi; scope: ProductDocScope; copy: ProductDocsCopy; locale: TmsLocale;
  ownerId?: string;
  drafts: ProductDocDraftBuffer; selection?: ProductDocSelection; path?: readonly ProductDocNode[];
  onSelect(selection?: ProductDocSelection): void; onChanged(): void;
}): ProductDocLifecycleContext {
  const latest = useRef(input); latest.current = input;
  const { api, scope, copy, locale, drafts, ownerId } = input;
  const onCompleted = useCallback<ProductDocLifecycleContext["onCompleted"]>((node, _mode, affected) => {
    const current = latest.current;
    if (current.api !== api || current.ownerId !== ownerId || current.scope.workspaceId !== scope.workspaceId
      || current.scope.projectId !== scope.projectId) return;
    // Without confirmed descendant IDs, only this selected root is safe to discard.
    if (affected.includes(node.id)) drafts.delete(productDocDraftKey(scope, node.id));
    const selectedAffected = current.selection?.docId === node.id || current.path?.some(parent => parent.id === node.id);
    const ancestryUnknown = Boolean(current.selection && current.path === undefined);
    if ((selectedAffected || ancestryUnknown) && current.selection?.version === undefined) current.onSelect(undefined);
    current.onChanged();
  }, [api, scope.workspaceId, scope.projectId, drafts, ownerId]);
  return useMemo(() => ({ api, scope, copy, locale, drafts, ownerId, onCompleted, onChanged: input.onChanged }),
    [api, scope, copy, locale, drafts, ownerId, onCompleted, input.onChanged]);
}
