import { useCallback, useLayoutEffect, useRef, useState } from "react";

// Measure against the actual grid tracks so density changes do not introduce blank rows.
export function useWidgetRows(enabled = true) {
  const element = useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = useState(1);
  const ref = useCallback((node: HTMLDivElement | null) => { element.current = node; }, []);
  useLayoutEffect(() => {
    const node = element.current;
    if (!node || !enabled) return;
    const measure = () => {
      const grid = node.parentElement; if (!grid) return;
      const style = getComputedStyle(grid);
      const gap = Number.parseFloat(style.rowGap) || 0;
      const track = Number.parseFloat(style.gridAutoRows) || 4;
      setRows(Math.max(1, Math.ceil((node.offsetHeight + gap) / (track + gap))));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);
  return { ref, rows };
}
