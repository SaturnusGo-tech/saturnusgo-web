import { useCallback, useEffect, useState, type SetStateAction, type Dispatch } from "react";
import { readNavigationContext, saveNavigationContext } from "../browser/workspace-history";
/** Per-history-entry UI state. Never store entities, credentials or unsaved form contents here. */
export function useNavigationValue<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [stored, setStored] = useState(() => ({ key, value: readNavigationContext(key, initial) }));
  const value = stored.key === key ? stored.value : readNavigationContext(key, initial);
  useEffect(() => {
    const restore = () => setStored({ key, value: readNavigationContext(key, initial) });
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [key]);
  const update = useCallback((next: SetStateAction<T>) => {
    setStored(current => {
      const before = current.key === key ? current.value : readNavigationContext(key, initial);
      const value = typeof next === "function" ? (next as (value: T) => T)(before) : next;
      saveNavigationContext(key, value);
      return { key, value };
    });
  }, [key]);
  return [value, update];
}
