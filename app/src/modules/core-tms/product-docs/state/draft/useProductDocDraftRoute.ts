import { useState } from "react";
import type { ProductDocScope, ProductDocSelection } from "../../domain/product-docs";
import { productDocDraftKey, type ProductDocDraftBuffer } from "./draft-buffer";

export function useProductDocDraftRoute(
  scope: ProductDocScope,
  selection: ProductDocSelection | undefined,
  drafts: ProductDocDraftBuffer,
) {
  const routeKey = JSON.stringify([selection?.docId, selection?.version]);
  const resumeDraft = selection?.version === undefined && !!selection?.docId
    && drafts.has(productDocDraftKey(scope, selection.docId));
  const [editor, setEditor] = useState({ key: routeKey, open: resumeDraft, folder: false });
  if (editor.key !== routeKey) setEditor({ key: routeKey, open: resumeDraft, folder: false });
  const explicitDraft = editor.key === routeKey ? editor.open : resumeDraft;
  return { routeKey, editor, explicitDraft, setEditor };
}
