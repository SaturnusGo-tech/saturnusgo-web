import { useCallback, type RefObject } from "react";
import { useProductDocsWorkspace } from "../../product-docs/composition/context/ProductDocsContext";
import { readProductDocSmartTarget } from "../../product-docs/navigation/product-doc-smart-link";

/** The common case/comment editor uses the same scoped side panels as document links. */
export function useCaseReferenceNavigation(validateUrl: (url: string) => boolean, trigger: RefObject<HTMLElement | null>) {
  const workspace = useProductDocsWorkspace();
  return useCallback((url: string) => {
    if (!validateUrl(url)) return;
    const target = workspace && readProductDocSmartTarget(url, window.location.href, workspace.scope);
    const anchor = trigger.current ?? document.body;
    if (target?.kind === "case" && workspace?.openCase) {
      workspace.openCase(target.id, anchor, target.projectId); return;
    }
    if (target?.kind === "document" && workspace?.openDocument) {
      workspace.openDocument({ docId: target.id, sectionId: target.sectionId, version: target.version }, anchor); return;
    }
    if (target?.kind === "repository" && workspace?.openRepository) {
      workspace.openRepository(target, anchor); return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }, [trigger, validateUrl, workspace]);
}
