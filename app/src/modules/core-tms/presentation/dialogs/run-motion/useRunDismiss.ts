import { useEffect, useRef, useState } from "react";
export function useRunDismiss() {
  const panelRef = useRef<HTMLElement | null>(null);
  const scrimAnimation = useRef<Animation | undefined>(undefined);
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef(false);
  useEffect(() => {
    const backdrop = panelRef.current?.parentElement;
    if (backdrop && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scrimAnimation.current = backdrop.animate([{ backgroundColor: "transparent" }, { backgroundColor: getComputedStyle(backdrop).backgroundColor }], { duration: 240, easing: "ease-out" });
    }
    return () => { clearTimeout(timer.current); scrimAnimation.current?.cancel(); };
  }, []);
  function dismiss(done: () => void) {
    if (pending.current) return;
    pending.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
    const panel = panelRef.current; const backdrop = panel?.parentElement;
    if (panel) panel.style.setProperty("--run-exit-from", getComputedStyle(panel).transform);
    if (backdrop) {
      const from = getComputedStyle(backdrop).backgroundColor;
      scrimAnimation.current?.cancel();
      scrimAnimation.current = backdrop.animate([{ backgroundColor: from }, { backgroundColor: "transparent" }], { duration: 240, fill: "forwards" });
    }
    setClosing(true); timer.current = setTimeout(done, 240);
  }
  return { closing, dismiss, panelRef };
}
