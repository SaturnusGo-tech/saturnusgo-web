import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { ProductDocLinkPreview, ProductDocScope } from "../domain/product-docs";
import type { ProductDocSmartTarget } from "../navigation/product-doc-smart-link";
import { resolveProductDocRepository } from "./repository/product-doc-repository-reference";
import type { ProductDocSmartPreview } from "../domain/links/product-doc-smart-preview";

type CacheEntry = { until: number; preview: Promise<ProductDocSmartPreview | null> };
const caches = new WeakMap<TmsHttpClient, Map<string, CacheEntry>>();

export function resolveProductDocSmartLink(client: TmsHttpClient, scope: ProductDocScope, target: ProductDocSmartTarget) {
  const workspaceId = scope.workspaceId;
  const projectId = target.kind === "case" ? target.projectId ?? scope.projectId : scope.projectId;
  if (target.kind === "repository") return resolveProductDocRepository(client, scope, target).then(value => value ? {
    kind: "repository" as const, title: value.folder.name, description: null, host: null,
    path: [value.projectName, ...value.folder.path.split("/").filter(Boolean)],
    ...(value.folder.archivedAt ? {status: "archived" as const} : {}),
  } : null);
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
  const body = requestTarget.kind === "case" ? {kind: requestTarget.kind, id: requestTarget.id} : requestTarget;
  const preview = client.mutateResource<ProductDocLinkPreview>(path, "POST", body)
    .then(({ data }) => data, () => null);
  if (cache.size >= 256) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { until: Date.now() + 30_000, preview });
  return preview;
}
