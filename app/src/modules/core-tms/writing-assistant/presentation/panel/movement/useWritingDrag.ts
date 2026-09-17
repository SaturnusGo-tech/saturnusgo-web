import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from "react";
import type { PopupPoint } from "./geometry";

const HOLD_MS = 350;
type Gesture = { id: number; handle: HTMLButtonElement; x: number; y: number; origin: PopupPoint; active: boolean };

export function useWritingDrag(panel: RefObject<HTMLDivElement | null>, move: (point: PopupPoint) => void, enabled: boolean) {
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveRef = useRef(move); moveRef.current = move;
  function finish() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    const current = gesture.current; gesture.current = null;
    if (current?.handle.hasPointerCapture(current.id)) current.handle.releasePointerCapture(current.id);
    setDragging(false);
  }
  useEffect(() => {
    if (!enabled) finish();
  }, [enabled]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) finish(); };
    window.addEventListener("blur", finish);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("blur", finish); document.removeEventListener("visibilitychange", hidden);
      finish();
    };
  }, []);
  function down(event: PointerEvent<HTMLButtonElement>) {
    if (!enabled || !event.isPrimary || event.button !== 0 || !panel.current || gesture.current) return;
    event.preventDefault();
    const current: Gesture = { id: event.pointerId, handle: event.currentTarget, x: event.clientX, y: event.clientY,
      origin: { left: panel.current.offsetLeft, top: panel.current.offsetTop }, active: false };
    gesture.current = current;
    current.handle.setPointerCapture(current.id);
    timer.current = setTimeout(() => {
      timer.current = null;
      if (gesture.current !== current) return;
      current.active = true; setDragging(true);
    }, HOLD_MS);
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x, dy = event.clientY - current.y;
    if (!current.active) { if (Math.hypot(dx, dy) > 8) finish(); return; }
    event.preventDefault();
    moveRef.current({ left: current.origin.left + dx, top: current.origin.top + dy });
  }
  function end(event: PointerEvent<HTMLButtonElement>) { if (gesture.current?.id === event.pointerId) finish(); }
  function keyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (!enabled || !panel.current || event.altKey || event.metaKey || event.ctrlKey) return;
    const vector = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!vector) return;
    event.preventDefault(); event.stopPropagation(); finish();
    const distance = event.shiftKey ? 48 : 16;
    moveRef.current({ left: panel.current.offsetLeft + vector[0] * distance, top: panel.current.offsetTop + vector[1] * distance });
  }
  return { dragging, handle: { onPointerDown: down, onPointerMove: pointerMove, onPointerUp: end, onPointerCancel: end,
    onLostPointerCapture: end, onKeyDown: keyboard, onContextMenu: (event: MouseEvent) => event.preventDefault() } };
}
