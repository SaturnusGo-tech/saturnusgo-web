import type { NavigationEntry } from "../history/history";

type Storage = {
  read: (key: string) => string | null;
  write: (key: string, value: string) => void;
};

/** Scroll and filters belong to a history entry, but are not URL navigations. */
export function createNavigationContextStore(storage: Storage) {
  const cache = new Map<string, NavigationEntry["context"]>();
  const key = (entry: NavigationEntry) => `falcon.navigation.context.v1.${entry.session}.${entry.index}`;
  const remember = (id: string, context: NavigationEntry["context"]) => {
    cache.delete(id);
    cache.set(id, context);
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
  };
  return {
    read(entry: NavigationEntry): NavigationEntry {
      const id = key(entry);
      let context = cache.get(id);
      if (!context) {
        try {
          const saved = JSON.parse(storage.read(id) ?? "null");
          if (saved && typeof saved === "object" && !Array.isArray(saved)) context = saved;
        } catch { /* Old native history context remains usable if storage is unavailable. */ }
        context ??= entry.context;
        remember(id, context);
      }
      return { ...entry, context };
    },
    write(entry: NavigationEntry) {
      const id = key(entry);
      remember(id, entry.context);
      try { storage.write(id, JSON.stringify(entry.context)); }
      catch { /* Keep this tab's Back/Forward context when session storage is blocked or full. */ }
    },
  };
}
