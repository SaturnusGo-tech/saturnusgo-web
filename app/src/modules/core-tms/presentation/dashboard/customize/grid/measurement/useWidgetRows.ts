import { useCallback, useLayoutEffect, useRef, useState } from "react";

// Match the 4px grid track and 12px gap; content keeps its intrinsic height.
export function useWidgetRows() {
  const element = useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = useState(1);
  const ref = useCallback((node: HTMLDivElement | null) => { element.current = node; }, []);
  useLayoutEffect(() => {
    const node = element.current;
    if (!node) return;
    const measure = () => setRows(Math.max(1, Math.ceil((node.offsetHeight + 12) / 16)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, rows };
}
