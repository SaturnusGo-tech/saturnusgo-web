import { useLayoutEffect, useRef } from "react";

/** Animate the committed page, without remounting editors or delaying navigation. */
export function usePageAppearance(view: string) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element?.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = element.animate([{ opacity: 0.55 }, { opacity: 1 }], {
      duration: 180,
      easing: "cubic-bezier(.2, .72, .3, 1)",
    });
    return () => animation.cancel();
  }, [view]);
  return ref;
}
