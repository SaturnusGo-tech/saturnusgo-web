import { useLayoutEffect, useRef, useState } from "react";

/** One fade owns the entire dialog; retain its focus scope through the exit. */
export function useSupportDialogMotion(open: boolean) {
  const [present, setPresent] = useState(open);
  const ref = useRef<HTMLDivElement>(null);
  const interrupted = useRef<string | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const from = interrupted.current ?? (open ? "0" : "1");
    const to = open ? "1" : "0";
    interrupted.current = null;
    // Commit the resting value before starting the effect. Removing a finished
    // animation must never expose the previous opacity for even a single frame.
    element.style.opacity = to;
    if (!element.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPresent(open); return;
    }
    if (open) setPresent(true);
    const animation = element.animate([{ opacity: from }, { opacity: to }], {
      duration: open ? 240 : 200, easing: "cubic-bezier(.22,.68,.25,1)", fill: "both",
    });
    let cancelled = false;
    let finished = false;
    void animation.finished.then(() => {
      if (cancelled) return;
      finished = true;
      if (open) animation.cancel();
      else setPresent(false);
    }, () => {});
    return () => {
      cancelled = true;
      if (!finished) interrupted.current = window.getComputedStyle(element).opacity;
      animation.cancel();
    };
  }, [open]);
  return { ref, present: open || present };
}
