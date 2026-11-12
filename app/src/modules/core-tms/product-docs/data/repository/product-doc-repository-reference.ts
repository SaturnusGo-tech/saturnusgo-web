import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { listFolders } from "../../../folders/data/folder-api";
import type { RepositoryFolder } from "../../../folders/model/folder";
import { getProject } from "../../../projects/data/project-api";
import type { ProductDocScope } from "../../domain/product-docs";
import { repositoryPath, type ProductDocRepositoryTarget } from "../../navigation/product-doc-smart-link";

type Catalog = {projectName: string; folders: readonly RepositoryFolder[]};
export type ProductDocRepositoryReference = Catalog & {folder: RepositoryFolder};
const caches = new WeakMap<TmsHttpClient, Map<string, {until: number; value: Promise<Catalog | null>}>>();

export async function resolveProductDocRepository(client: TmsHttpClient, scope: ProductDocScope,
  target: ProductDocRepositoryTarget): Promise<ProductDocRepositoryReference | null> {
  const path = repositoryPath(target.folderPath ?? "");
  if (!target.folderId && !path) return null;
  let cache = caches.get(client);
  if (!cache) { cache = new Map(); caches.set(client, cache); }
  const key = JSON.stringify([scope.workspaceId, target.projectId]);
  let entry = cache.get(key);
  if (!entry || entry.until <= Date.now()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const value = Promise.all([getProject(client, target.projectId, controller.signal),
      listFolders(client, {...scope, projectId: target.projectId}, controller.signal)])
      .then(([project, folders]) => project.data.id === target.projectId ? {
        projectName: project.data.name,
        folders: folders.filter(folder => folder.workspaceId === scope.workspaceId && folder.projectId === target.projectId),
      } : null, () => null).finally(() => clearTimeout(timeout));
    entry = {until: Date.now() + 30_000, value};
    if (cache.size >= 64) cache.delete(cache.keys().next().value!);
    cache.set(key, entry);
  }
  const catalog = await entry.value;
  if (!catalog) return null;
  const matches = catalog.folders.filter(folder => target.folderId ? folder.id === target.folderId
    : repositoryPath(folder.path) === path);
  return matches.length === 1 ? {...catalog, folder: matches[0]} : null;
}
