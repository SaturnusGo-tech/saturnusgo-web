import { useEffect, useRef } from "react";

export function useFolderDropReveal(over: boolean, open: boolean, id: string, expand?: (id: string) => void) {
  const latest = useRef(expand);
  latest.current = expand;
  useEffect(() => {
    if (!over || !latest.current) return;
    if (open) { latest.current(id); return; }
    const timer = setTimeout(() => latest.current?.(id), 650);
    return () => clearTimeout(timer);
  }, [over, open, id]);
}
