import { useLayoutEffect, type RefObject } from "react";

/** Creation slides in; a ready case reveals locally, without retaining the previous case's text. */
export function useCreateCaseEntrance(panel: RefObject<HTMLElement | null>, creating: boolean, caseId?: string) {
  useLayoutEffect(() => {
    const element = panel.current;
    if ((!creating && !caseId) || !element?.animate) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const animation = element.animate(creating ? [
      { transform: "translateX(100%)", opacity: .5 },
      { transform: "translateX(0)", opacity: 1 },
    ] : [{ opacity: 0 }, { opacity: 1 }], { duration: creating ? 280 : 140, easing: "cubic-bezier(.2,.72,.3,1)" });
    const reduce = () => { if (preference.matches) animation.cancel(); };
    preference.addEventListener?.("change", reduce);
    return () => {
      preference.removeEventListener?.("change", reduce);
      animation.cancel();
    };
  }, [creating, panel, caseId]);
}
