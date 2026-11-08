import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useProductDocsWorkspace } from "../../composition/context/ProductDocsContext";
import { resolveProductDocSmartLink } from "../../data/product-doc-link-preview";
import type { ProductDocLinkPreview } from "../../domain/product-docs";
import { readProductDocSmartTarget } from "../../navigation/product-doc-smart-link";

export function useProductDocLinkPreview(href: string | undefined) {
  const workspace = useProductDocsWorkspace();
  const client = useOptionalTmsHttpClient();
  const scope = workspace?.scope;
  const target = useMemo(() => href && scope && typeof window !== "undefined"
    ? readProductDocSmartTarget(href, window.location.href, scope) : null, [href, scope]);
  const [loaded, setLoaded] = useState<{ target: typeof target; value: ProductDocLinkPreview | null }>();
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
      workspace.openCase(target.id, event.currentTarget);
    }
    if (target?.kind === "document" && workspace?.openDocument) {
      event.preventDefault();
      workspace.openDocument({ docId: target.id, sectionId: target.sectionId, version: target.version }, event.currentTarget);
    }
  }
  return { target, preview: loaded?.target === target ? loaded?.value : undefined, workspace, follow };
}
