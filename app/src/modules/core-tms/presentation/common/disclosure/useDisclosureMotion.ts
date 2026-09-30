import { useLayoutEffect, useRef, useState } from "react";

/** Keep closing content present only until its measured height has collapsed. */
export function useDisclosureMotion(open: boolean, slide = false, { overflow = "hidden" }: { overflow?: "hidden" | "visible" } = {}) {
  const [present, setPresent] = useState(open);
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(open);
  const interrupted = useRef<Keyframe | null>(null);
  useLayoutEffect(() => {
    if (previous.current === open) return;
    previous.current = open;
    const element = ref.current;
    if (!element || !element.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPresent(open); return;
    }
    if (open) setPresent(true);
    // QL suggestions are absolute overlays: scrollHeight includes them, flow height does not.
    const height = overflow === "visible" && element.firstElementChild
      ? element.firstElementChild.getBoundingClientRect().height : element.scrollHeight;
    const from = interrupted.current ?? { height: `${open ? 0 : element.getBoundingClientRect().height}px`,
      opacity: open ? (overflow === "visible" ? 0 : .4) : 1, transform: slide && open ? "translateY(-6px)" : "none" };
    interrupted.current = null;
    element.style.overflow = overflow;
    const animation = element.animate([from,
      { height: `${open ? height : 0}px`, opacity: open ? 1 : 0, transform: slide && !open ? "translateY(-6px)" : "none" }],
    { duration: overflow === "visible" ? 260 : slide ? 220 : 180, easing: "cubic-bezier(.22,.68,.25,1)", fill: "both" });
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
      if (!finished) {
        const visual = window.getComputedStyle(element);
        interrupted.current = { height: `${element.getBoundingClientRect().height}px`, opacity: visual.opacity, transform: visual.transform };
      }
      animation.cancel(); element.style.overflow = "";
    };
  }, [open, slide, overflow]);
  return { ref, present: open || present };
}
