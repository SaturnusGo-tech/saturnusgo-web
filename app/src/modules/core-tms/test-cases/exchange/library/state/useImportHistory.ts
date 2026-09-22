import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { useCatalogPage } from "../../../../portfolios/state/catalog/useCatalogPage";
import { importFileApi } from "../data/import-files";
import type { ImportScope } from "../model/import-file";

export function useImportHistory(scope: ImportScope, revision: number) {
  const http = useTmsHttpClient();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const page = useCatalogPage(`${scope.workspaceId}:${scope.projectId}:${search}:${revision}`, true,
    (cursor, signal) => importFileApi.list(http, scope, search, cursor, signal));
  return { ...page, query, setQuery, searching: query.trim() !== search };
}
