import { useEffect, useRef, useState } from "react";

/** A brief page exit, without drawer translation or a backdrop. */
export function useDefectPageDismiss() {
  const panelRef = useRef<HTMLElement | null>(null), pending = useRef(false);
  const [closing, setClosing] = useState(false);
  const animation = useRef<Animation | null>(null), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(timer.current); animation.current?.cancel(); }, []);
  function dismiss(done: () => void) {
    if (pending.current) return;
    pending.current = true;
    const panel = panelRef.current;
    if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
    panel.inert = true;
    panel.style.animation = "none";
    animation.current = panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-out", fill: "forwards" });
    setClosing(true);
    timer.current = setTimeout(done, 160);
  }
  return { closing, dismiss, panelRef };
}
