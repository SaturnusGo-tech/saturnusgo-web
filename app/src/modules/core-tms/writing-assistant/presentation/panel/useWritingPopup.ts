import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { constrainPopup, POPUP_MARGIN, popupViewport, type PopupPoint } from "./movement/geometry";
import { useWritingDrag } from "./movement/useWritingDrag";

export function useWritingPopup(anchor: RefObject<HTMLButtonElement | null>, onClose: () => void, enabled = true) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const floating = useRef<PopupPoint | null>(null);
  const [position, setPosition] = useState({ left: 12, top: 12, maxWidth: "calc(100vw - 24px)", maxHeight: "calc(100dvh - 24px)" });
  const drag = useWritingDrag(panel, (point) => {
    const box = panel.current; if (!box) return;
    floating.current = constrainPopup(point, { width: box.offsetWidth, height: box.offsetHeight });
    setPosition((previous) => ({ ...previous, ...floating.current }));
  }, enabled);
  useLayoutEffect(() => {
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      const box = panel.current;
      if (!rect || !box) return;
      const viewport = popupViewport();
      const width = Math.max(0, viewport.width - POPUP_MARGIN * 2), height = Math.max(0, viewport.height - POPUP_MARGIN * 2);
      const point = constrainPopup(floating.current ?? { left: rect.left, top: rect.bottom + 10 },
        { width: Math.min(box.offsetWidth, width), height: Math.min(box.offsetHeight, height) }, viewport);
      if (floating.current) floating.current = point;
      setPosition({ ...point, maxWidth: `${width}px`, maxHeight: `${height}px` });
    };
    place();
    const observer = new ResizeObserver(place);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", place); viewport?.addEventListener("scroll", place);
    return () => {
      observer.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true);
      viewport?.removeEventListener("resize", place); viewport?.removeEventListener("scroll", place);
    };
  }, [anchor]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => panel.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus());
    const outside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !anchor.current?.contains(event.target as Node)) close.current();
    };
    document.addEventListener("pointerdown", outside, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("pointerdown", outside, true); };
  }, [anchor]);
  return { panel, position, ...drag };
}
