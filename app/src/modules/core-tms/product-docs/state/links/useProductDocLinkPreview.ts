import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useProductDocsWorkspace } from "../../composition/context/ProductDocsContext";
import { resolveProductDocSmartLink } from "../../data/product-doc-link-preview";
import type { ProductDocSmartPreview } from "../../domain/links/product-doc-smart-preview";
import { readProductDocSmartTarget } from "../../navigation/product-doc-smart-link";

export function useProductDocLinkPreview(href: string | undefined) {
  const workspace = useProductDocsWorkspace();
  const client = useOptionalTmsHttpClient();
  const scope = workspace?.scope;
  const [currentUrl, setCurrentUrl] = useState<string>();
  useEffect(() => setCurrentUrl(window.location.href), [href, scope]);
  const target = useMemo(() => href && scope && currentUrl
    ? readProductDocSmartTarget(href, currentUrl, scope) : null, [href, scope, currentUrl]);
  const [loaded, setLoaded] = useState<{ target: typeof target; value: ProductDocSmartPreview | null }>();
  useEffect(() => {
    if (!client || !scope || !target) return;
    let active = true;
    void resolveProductDocSmartLink(client, scope, target).then(value => {
      if (active) setLoaded({ target, value });
    });
    return () => { active = false; };
  }, [client, scope, target]);
  function follow(event: MouseEvent<HTMLAnchorElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    if (target?.kind === "case" && workspace?.openCase) {
      event.preventDefault();
      workspace.openCase(target.id, event.currentTarget, target.projectId);
    }
    if (target?.kind === "document" && workspace?.openDocument) {
      event.preventDefault();
      workspace.openDocument({ docId: target.id, sectionId: target.sectionId, version: target.version }, event.currentTarget);
    }
    if (target?.kind === "repository" && workspace?.openRepository) {
      event.preventDefault();
      workspace.openRepository(target, event.currentTarget);
    }
  }
  const previewPending = Boolean(client && scope && target && loaded?.target !== target);
  return { target, preview: loaded?.target === target ? loaded?.value : undefined, previewPending, workspace, follow };
}
