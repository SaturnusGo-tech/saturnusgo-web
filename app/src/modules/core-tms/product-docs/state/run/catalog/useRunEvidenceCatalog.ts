"use client";

import { useCallback } from "react";
import { TmsApiError, type TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { useOptionalTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { listCustomFields, listCustomFieldValues } from "../../../../custom-fields/data/custom-field-api";
import type { CustomFieldPage } from "../../../../custom-fields/model/custom-field";
import { listFolders } from "../../../../folders/data/folder-api";
import { loadAllWorkspaceProjects } from "../../../../projects/catalog/application/list-projects";
import type { ProductDocScope } from "../../../domain/product-docs";
import { useProductDocResource } from "../../useProductDocResource";

type Option = { value: string; label: string };
export type RunEvidenceCatalogKind = "folders" | "productGroups" | "products";

export function useRunEvidenceProjects(workspaceId: string, enabled: boolean) {
  const http = useOptionalTmsHttpClient();
  const request = useCallback(async (signal: AbortSignal) => {
    if (!http) return [];
    const projects = await loadAllWorkspaceProjects(http, workspaceId, signal);
    return projects.map(({ id, name }) => ({ value: id, label: name }));
  }, [http, workspaceId]);
  return useProductDocResource(enabled ? request : undefined);
}

export function useRunEvidenceCatalog(scope: ProductDocScope, projectIds: readonly string[], kind: RunEvidenceCatalogKind | undefined) {
  const http = useOptionalTmsHttpClient();
  const { workspaceId, projectId } = scope;
  const selected = projectIds.join(",");
  const request = useCallback(async (signal: AbortSignal) => {
    if (!http || !kind) return [];
    const projectIds = selected ? selected.split(",") : [projectId];
    const options = new Map<string, Option>();
    for (let index = 0; index < projectIds.length; index += 4) {
      signal.throwIfAborted();
      const batch = await Promise.all(projectIds.slice(index, index + 4).map(async (id) => {
        try {
          return await loadCatalog(http, { workspaceId, projectId: id }, kind, signal);
        } catch (error) {
          if (error instanceof TmsApiError && (error.status === 403 || error.status === 404)) return [];
          throw error;
        }
      }));
      for (const option of batch.flat()) options.set(option.value, option);
    }
    return [...options.values()].sort((left, right) => left.label.localeCompare(right.label));
  }, [http, kind, projectId, selected, workspaceId]);
  return useProductDocResource(kind ? request : undefined);
}

async function loadCatalog(http: TmsHttpClient, scope: ProductDocScope, kind: RunEvidenceCatalogKind, signal: AbortSignal): Promise<Option[]> {
  if (kind === "folders") {
    const folders = await listFolders(http, scope, signal);
    return folders.map(({ path }) => ({ value: path, label: path }));
  }
  const systemKey = kind === "productGroups" ? "product_group" : "product";
  const definitions = await allPages((cursor) => listCustomFields(http, scope, { status: "all", cursor }, signal));
  const field = definitions.find((item) => item.systemKey === systemKey);
  if (!field) return [];
  const values = await allPages((cursor) => listCustomFieldValues(http, scope, field.id, { status: "all", cursor }, signal));
  return values.map(({ id, label }) => ({ value: id, label }));
}

async function allPages<T>(load: (cursor: string | null) => Promise<CustomFieldPage<T>>) {
  const values: T[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  do {
    const page = await load(cursor);
    values.push(...page.items);
    cursor = page.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error("Run filter catalog pagination did not advance");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return values;
}
