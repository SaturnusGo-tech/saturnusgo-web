import { useLayoutEffect, useRef, type RefObject } from "react";
import { flushSync } from "react-dom";

/** Keep the live panel mounted until dismissal finishes; never close after its owner unmounts. */
export function useCasePanelExit(panel: RefObject<HTMLElement | null>, enabled: boolean, caseId?: string) {
  const closing = useRef(false), cleanup = useRef<(() => void) | null>(null);
  useLayoutEffect(() => () => { cleanup.current?.(); }, [panel, enabled, caseId]);
  return (close: () => void) => {
    if (closing.current) return;
    const element = panel.current, preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!enabled || !element?.animate || preference.matches) { close(); return; }
    const originalInert = element.inert, origin = getComputedStyle(element);
    const first = { transform: origin.transform === "none" ? "translateX(0)" : origin.transform, opacity: origin.opacity };
    element.getAnimations?.().forEach(animation => animation.cancel());
    let animation: Animation;
    try { animation = element.animate([first, { transform: "translateX(100%)", opacity: 0 }], { duration: 280, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }); }
    catch { close(); return; }
    closing.current = true; element.inert = true;
    element.dataset.casePanelClosing = "";
    let settled = false;
    const settle = (complete: boolean) => {
      if (settled) return;
      settled = true; preference.removeEventListener?.("change", reduce);
      cleanup.current = null;
      // Replace the hidden panel before dropping its filled exit frame, so it cannot flash back.
      try { if (complete) flushSync(close); }
      finally {
        delete element.dataset.casePanelClosing;
        element.inert = originalInert;
        animation.cancel();
        closing.current = false;
      }
    };
    const reduce = () => { if (preference.matches) settle(true); };
    cleanup.current = () => settle(false);
    preference.addEventListener?.("change", reduce);
    void animation.finished.then(() => settle(true), () => settle(true));
  };
}
