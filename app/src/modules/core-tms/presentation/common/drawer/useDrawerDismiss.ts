import { useEffect, useRef, useState } from "react";

/** Keep a drawer mounted until its panel and scrim have left the viewport. */
export function useDrawerDismiss() {
  const panelRef = useRef<HTMLElement | null>(null);
  const animations = useRef<Animation[]>([]);
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef(false);
  useEffect(() => () => {
    clearTimeout(timer.current);
    animations.current.forEach(animation => animation.cancel());
  }, []);
  function dismiss(done: () => void) {
    if (pending.current) return;
    pending.current = true;
    const panel = panelRef.current;
    if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
    const transform = getComputedStyle(panel).transform;
    const backdrop = panel.parentElement;
    panel.inert = true;
    panel.style.animation = "none";
    animations.current.push(panel.animate([{ transform }, { transform: "translateX(100%)" }],
      { duration: 240, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" }));
    if (backdrop) {
      const { backgroundColor, backdropFilter } = getComputedStyle(backdrop);
      backdrop.style.animation = "none";
      animations.current.push(backdrop.animate([{ backgroundColor, backdropFilter }, { backgroundColor: "transparent", backdropFilter: "blur(0px)" }],
        { duration: 240, easing: "ease-in", fill: "forwards" }));
    }
    setClosing(true);
    timer.current = setTimeout(done, 240);
  }
  return { closing, dismiss, panelRef };
}
