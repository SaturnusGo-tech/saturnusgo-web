import { useEffect, useRef, useState, type RefObject } from "react";

export function useHistoryDisclosure(container: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(true);
  const previousNarrow = useRef<boolean | null>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const next = element.getBoundingClientRect().width <= 860;
      if (next !== previousNarrow.current) { previousNarrow.current = next; setNarrow(next); setOpen(!next); }
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener("resize", measure);
    return () => { active = false; observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [container]);
  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) container.current?.querySelector<HTMLButtonElement>('button[aria-controls="falcon-ai-history"]')?.focus();
  }
  return { open, narrow, toggle: () => setOpen(value => !value), close,
    afterNavigate: () => { if (narrow) close(); } };
}
