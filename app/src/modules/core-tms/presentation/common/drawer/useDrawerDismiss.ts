import { useEffect, useRef, useState } from "react";

/** Keep a drawer mounted until its panel and scrim have left the viewport. */
export function useDrawerDismiss() {
  const panelRef = useRef<HTMLElement | null>(null);
  const animations = useRef<Animation[]>([]);
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<Promise<void> | null>(null);
  const settle = useRef<(() => void) | undefined>(undefined);
  const cancelAnimations = () => {
    animations.current.forEach(animation => { try { animation.cancel(); } catch { /* Motion must not block dismissal. */ } });
    animations.current = [];
  };
  useEffect(() => () => {
    clearTimeout(timer.current); settle.current?.();
    cancelAnimations();
  }, []);
  function dismiss(done: () => void) {
    if (pending.current) return pending.current;
    const promise = new Promise<void>(resolve => { settle.current = resolve; });
    pending.current = promise;
    const finish = () => { try { done(); } finally { settle.current?.(); } };
    const panel = panelRef.current;
    if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return promise; }
    const backdrop = panel.parentElement;
    const previous = { inert: panel.inert, panelAnimation: panel.style.animation, backdropAnimation: backdrop?.style.animation };
    try {
      const transform = getComputedStyle(panel).transform;
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
      timer.current = setTimeout(finish, 240);
    } catch {
      cancelAnimations();
      panel.inert = previous.inert;
      panel.style.animation = previous.panelAnimation;
      if (backdrop) backdrop.style.animation = previous.backdropAnimation ?? "";
      finish();
    }
    return promise;
  }
  return { closing, dismiss, panelRef };
}
