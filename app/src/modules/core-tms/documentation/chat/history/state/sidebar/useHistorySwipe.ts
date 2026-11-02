import { useRef, type MouseEvent, type PointerEvent } from "react";

type Gesture = { id: number; x: number; y: number; horizontal: boolean };

export function useHistorySwipe(onClose: (restoreFocus?: boolean) => void) {
  const gesture = useRef<Gesture | null>(null), blockClick = useRef(false);
  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      blockClick.current = false; gesture.current = null;
      if (!event.isPrimary || event.button !== 0 || (event.target as Element).closest("input,textarea,select,[contenteditable=true]")) return;
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      const point = gesture.current;
      if (!point || point.id !== event.pointerId) return;
      const dx = event.clientX - point.x, dy = event.clientY - point.y;
      if (!point.horizontal && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { gesture.current = null; return; }
      if (!point.horizontal && dx < -18 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        point.horizontal = true; event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (point.horizontal) { event.preventDefault(); event.stopPropagation(); }
    },
    onPointerUp(event: PointerEvent<HTMLDivElement>) {
      const point = gesture.current; gesture.current = null;
      if (!point || point.id !== event.pointerId || !point.horizontal) return;
      event.preventDefault(); event.stopPropagation(); blockClick.current = true;
      const dx = event.clientX - point.x, dy = event.clientY - point.y;
      if (dx <= -48 && Math.abs(dx) > Math.abs(dy) * 1.4) onClose(true);
    },
    onPointerCancel() { gesture.current = null; },
    onLostPointerCapture() { gesture.current = null; },
    onClickCapture(event: MouseEvent<HTMLDivElement>) {
      if (blockClick.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); }
      blockClick.current = false;
    },
  };
}
