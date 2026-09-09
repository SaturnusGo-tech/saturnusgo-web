import { useLayoutEffect, useRef, useState } from "react";

/** Keep closing content present only until its measured height has collapsed. */
export function useDisclosureMotion(open: boolean) {
  const [present, setPresent] = useState(open);
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(open);
  const interruptedHeight = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (previous.current === open) return;
    previous.current = open;
    const element = ref.current;
    if (!element || !element.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPresent(open); return;
    }
    if (open) setPresent(true);
    const from = interruptedHeight.current ?? (open ? 0 : element.getBoundingClientRect().height);
    interruptedHeight.current = null;
    element.style.overflow = "hidden";
    const animation = element.animate([{ height: `${from}px`, opacity: open ? .4 : 1 },
      { height: `${open ? element.scrollHeight : 0}px`, opacity: open ? 1 : 0 }],
    { duration: 180, easing: "cubic-bezier(.22,.68,.25,1)", fill: "both" });
    let finished = false;
    let cancelled = false;
    void animation.finished.then(() => {
      if (cancelled) return;
      finished = true;
      if (!open) setPresent(false);
      else { animation.cancel(); element.style.overflow = ""; }
    }, () => { /* Reversing direction cancels the previous visual interpolation. */ });
    return () => {
      cancelled = true;
      if (!finished) interruptedHeight.current = element.getBoundingClientRect().height;
      animation.cancel(); element.style.overflow = "";
    };
  }, [open]);
  return { ref, present: open || present };
}
