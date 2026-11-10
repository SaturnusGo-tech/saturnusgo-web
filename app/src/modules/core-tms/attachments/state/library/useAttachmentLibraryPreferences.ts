import { useEffect, useState } from "react";

function storedIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string =>
    typeof id === "string" && /^[a-z0-9_-]{1,100}$/i.test(id)))].slice(0, 100) : [];
}

export function useAttachmentLibraryPreferences(workspaceId: string, subject: string | null) {
  const storageKey = subject && `falcon.attachment-library.${JSON.stringify([workspaceId, subject])}`;
  const [favorites, setFavorites] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    let saved: string[] = [];
    try {
      const value = storageKey && window.localStorage.getItem(storageKey);
      if (value) {
        const parsed = JSON.parse(value) as { favorites?: unknown };
        saved = storedIds(parsed.favorites);
      }
    } catch { /* Storage may be disabled. */ }
    setFavorites(saved);
    setInitialized(true);
  }, [storageKey]);

  useEffect(() => {
    if (storageKey && initialized) {
      try { window.localStorage.setItem(storageKey, JSON.stringify({ favorites })); }
      catch { /* The catalog still works in this session. */ }
    }
  }, [storageKey, initialized, favorites]);

  return {
    favorites,
    toggleFavorite(id: string) {
      setFavorites(current => current.includes(id)
        ? current.filter(value => value !== id) : [id, ...current].slice(0, 100));
    },
  };
}
