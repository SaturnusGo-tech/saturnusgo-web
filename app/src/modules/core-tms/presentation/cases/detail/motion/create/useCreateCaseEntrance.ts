import { useLayoutEffect, type RefObject } from "react";

/** Animate the existing inspector surface without remounting its form or draft. */
export function useCreateCaseEntrance(panel: RefObject<HTMLElement | null>, creating: boolean) {
  useLayoutEffect(() => {
    const element = panel.current;
    if (!creating || !element?.animate) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const animation = element.animate([
      { transform: "translateX(100%)", opacity: .5 },
      { transform: "translateX(0)", opacity: 1 },
    ], { duration: 280, easing: "cubic-bezier(.2,.72,.3,1)" });
    const reduce = () => { if (preference.matches) animation.cancel(); };
    preference.addEventListener?.("change", reduce);
    return () => {
      preference.removeEventListener?.("change", reduce);
      animation.cancel();
    };
  }, [creating, panel]);
}
