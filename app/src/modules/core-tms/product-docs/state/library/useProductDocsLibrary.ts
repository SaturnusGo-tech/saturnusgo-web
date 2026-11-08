"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductDocScope } from "../../domain/product-docs";

export type ProductDocsShelf = "overview" | "recent" | "starred" | "archive";
type Library = { recent: string[]; starred: string[] };
const empty: Library = { recent: [], starred: [] };
const maxEntries = 24;

function ids(value: unknown) {
  return Array.isArray(value) ? [...new Set(value.filter(
    (id): id is string => typeof id === "string" && id.length <= 200,
  ))].slice(0, maxEntries) : [];
}

export function useProductDocsLibrary(scope: ProductDocScope, subject?: string | null) {
  const key = subject
    ? "falcon.product-docs.library.v1:" + JSON.stringify([subject, scope.workspaceId, scope.projectId])
    : null;
  const [stored, setStored] = useState<{ key: string | null; value: Library }>();
  const library = stored && stored.key === key ? stored.value : empty;

  useEffect(() => {
    if (!key) return;
    try {
      const value = JSON.parse(window.localStorage.getItem(key) ?? "{}");
      setStored({ key, value: { recent: ids(value?.recent), starred: ids(value?.starred) } });
    } catch {
      setStored({ key, value: empty });
    }
  }, [key]);

  useEffect(() => {
    if (key && stored?.key === key) {
      try { window.localStorage.setItem(key, JSON.stringify(stored.value)); } catch { /* Memory remains available. */ }
    }
  }, [key, stored]);

  const update = useCallback((change: (previous: Library) => Library) => {
    setStored((previous) => {
      const value = previous?.key === key ? previous.value : empty;
      const next = change(value);
      return next === value && previous?.key === key ? previous : { key, value: next };
    });
  }, [key]);

  const visit = useCallback((id: string) => {
    update((previous) => previous.recent[0] === id ? previous : ({
      ...previous,
      recent: [id, ...previous.recent.filter((entry) => entry !== id)].slice(0, maxEntries),
    }));
  }, [update]);

  function toggleStar(id: string) {
    update((previous) => ({
      ...previous,
      starred: previous.starred.includes(id) ? previous.starred.filter((entry) => entry !== id)
        : [id, ...previous.starred].slice(0, maxEntries),
    }));
  }

  return { library, visit, toggleStar };
}
