import { useLayoutEffect, useRef } from "react";

/** Native transitions own snapshots. The fallback reveals only the stationary destination. */
export function usePageAppearance(destination: string, fromOpacity = 0) {
  const ref = useRef<HTMLDivElement | null>(null);
  const previous = useRef(destination);
  useLayoutEffect(() => {
    if (previous.current === destination) return;
    previous.current = destination;
    if (!ref.current?.animate || document.documentElement.dataset.falconTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = ref.current.animate([{ opacity: fromOpacity }, { opacity: 1 }],
      { duration: 180, easing: "cubic-bezier(.22,.68,.25,1)" });
    return () => animation.cancel();
  }, [destination, fromOpacity]);
  return ref;
}
