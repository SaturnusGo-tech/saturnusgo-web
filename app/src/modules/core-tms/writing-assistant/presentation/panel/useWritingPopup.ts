import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

export function useWritingPopup(anchor: RefObject<HTMLButtonElement | null>, onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const [position, setPosition] = useState({ left: 12, top: 12 });
  useLayoutEffect(() => {
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      const box = panel.current?.getBoundingClientRect();
      if (!rect || !box) return;
      setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - box.width - 12)),
        top: Math.max(12, Math.min(rect.bottom + 10, window.innerHeight - box.height - 12)) });
    };
    place();
    const observer = new ResizeObserver(place);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { observer.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [anchor]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => panel.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus());
    const outside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !anchor.current?.contains(event.target as Node)) close.current();
    };
    document.addEventListener("pointerdown", outside, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("pointerdown", outside, true); };
  }, [anchor]);
  return { panel, position };
}
