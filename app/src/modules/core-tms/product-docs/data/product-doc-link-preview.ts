import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { ProductDocLinkPreview, ProductDocScope } from "../domain/product-docs";
import type { ProductDocSmartTarget } from "../navigation/product-doc-smart-link";

type CacheEntry = { until: number; preview: Promise<ProductDocLinkPreview | null> };
const caches = new WeakMap<TmsHttpClient, Map<string, CacheEntry>>();

export function resolveProductDocSmartLink(client: TmsHttpClient, scope: ProductDocScope, target: ProductDocSmartTarget) {
  const { workspaceId, projectId } = scope;
  let cache = caches.get(client);
  if (!cache) { cache = new Map(); caches.set(client, cache); }
  let requestTarget = target;
  if (target.kind === "external") {
    const url = new URL(target.url);
    url.search = "";
    url.hash = "";
    requestTarget = { kind: "external", url: url.href };
  }
  const key = JSON.stringify([workspaceId, projectId, requestTarget]);
  const previous = cache.get(key);
  if (previous && previous.until > Date.now()) return previous.preview;
  const path = `/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/product-docs/link-preview`;
  const preview = client.mutateResource<ProductDocLinkPreview>(path, "POST", requestTarget)
    .then(({ data }) => data, () => null);
  if (cache.size >= 256) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { until: Date.now() + 30_000, preview });
  return preview;
}
