import { useLayoutEffect, useRef } from "react";

/** Native transitions own snapshots. The fallback reveals only the stationary destination. */
export function usePageAppearance(destination: string) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(destination);
  useLayoutEffect(() => {
    if (previous.current === destination) return;
    previous.current = destination;
    if (!ref.current?.animate || document.documentElement.dataset.falconTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = ref.current.animate([{ opacity: 0 }, { opacity: 1 }],
      { duration: 180, easing: "cubic-bezier(.22,.68,.25,1)" });
    return () => animation.cancel();
  }, [destination]);
  return ref;
}
