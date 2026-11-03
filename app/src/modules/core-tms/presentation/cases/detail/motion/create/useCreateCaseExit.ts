import { useLayoutEffect, useRef, type RefObject } from "react";
import { flushSync } from "react-dom";

/** Keep the live draft mounted until dismissal finishes; never close after its owner unmounts. */
export function useCreateCaseExit(panel: RefObject<HTMLElement | null>, creating: boolean) {
  const closing = useRef(false), cleanup = useRef<(() => void) | null>(null);
  useLayoutEffect(() => () => { cleanup.current?.(); }, [panel, creating]);
  return (close: () => void) => {
    if (closing.current) return;
    const element = panel.current, preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!creating || !element?.animate || preference.matches) { close(); return; }
    const originalInert = element.inert, origin = getComputedStyle(element);
    const first = { transform: origin.transform === "none" ? "translateX(0)" : origin.transform, opacity: origin.opacity };
    element.getAnimations?.().forEach(animation => animation.cancel());
    let animation: Animation;
    try { animation = element.animate([first, { transform: "translateX(100%)", opacity: 0 }], { duration: 280, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }); }
    catch { close(); return; }
    closing.current = true; element.inert = true;
    let settled = false;
    const settle = (complete: boolean) => {
      if (settled) return;
      settled = true; preference.removeEventListener?.("change", reduce);
      cleanup.current = null;
      // Replace the hidden draft before dropping its filled exit frame, so it cannot flash back.
      try { if (complete) flushSync(close); }
      finally { element.inert = originalInert; animation.cancel(); closing.current = false; }
    };
    const reduce = () => { if (preference.matches) settle(true); };
    cleanup.current = () => settle(false);
    preference.addEventListener?.("change", reduce);
    void animation.finished.then(() => settle(true), () => settle(true));
  };
}
