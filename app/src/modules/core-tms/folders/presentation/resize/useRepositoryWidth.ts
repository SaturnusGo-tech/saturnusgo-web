import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

const KEY = "tms.folders.width.v1";
export const REPOSITORY_MIN = 240;
export const REPOSITORY_MAX = 620;
export const REPOSITORY_DEFAULT = 304;
export function repositoryWidth(preference: number, available: number) {
  return Math.round(Math.max(REPOSITORY_MIN, Math.min(preference, REPOSITORY_MAX, Math.max(REPOSITORY_MIN, available - 420))));
}
export function useRepositoryWidth() {
  const ref = useRef<HTMLElement>(null);
  const preferred = useRef(REPOSITORY_DEFAULT);
  const frame = useRef<number | null>(null);
  const drag = useRef<{ id: number; x: number; width: number } | null>(null);
  const [width, setWidth] = useState(REPOSITORY_DEFAULT);
  const [resizing, setResizing] = useState(false);
  function apply() {
    const next = repositoryWidth(preferred.current, ref.current?.parentElement?.clientWidth ?? 1200);
    ref.current?.style.setProperty("--repository-width", `${next}px`);
    setWidth(next);
  }
  function remember() {
    try { localStorage.setItem(KEY, String(preferred.current)); } catch { /* Resizing remains available without browser storage. */ }
  }
  useEffect(() => {
    try { const saved = Number(localStorage.getItem(KEY)); if (Number.isFinite(saved) && saved >= REPOSITORY_MIN) preferred.current = Math.min(saved, REPOSITORY_MAX); } catch { /* Use the default width. */ }
    apply();
    const observer = new ResizeObserver(apply);
    if (ref.current?.parentElement) observer.observe(ref.current.parentElement);
    return () => { observer.disconnect(); if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, []);
  function finish(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null; apply(); remember(); setResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return { ref, width, resizing, style: { "--repository-width": `${width}px` } as CSSProperties,
    handleProps: {
      onPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (event.button !== 0) return;
        event.preventDefault(); event.stopPropagation();
        drag.current = { id: event.pointerId, x: event.clientX, width };
        event.currentTarget.setPointerCapture(event.pointerId); setResizing(true);
      },
      onPointerMove(event: PointerEvent<HTMLDivElement>) {
        if (drag.current?.id !== event.pointerId) return;
        preferred.current = repositoryWidth(drag.current.width + event.clientX - drag.current.x, ref.current?.parentElement?.clientWidth ?? 1200);
        if (frame.current === null) frame.current = requestAnimationFrame(() => { frame.current = null; apply(); });
      },
      onPointerUp: finish, onPointerCancel: finish,
      onDoubleClick() { preferred.current = REPOSITORY_DEFAULT; apply(); remember(); },
      onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const delta = event.key === "ArrowLeft" ? -20 : event.key === "ArrowRight" ? 20 : 0;
        if (!delta && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault(); preferred.current = event.key === "Home" ? REPOSITORY_MIN : event.key === "End" ? REPOSITORY_MAX : width + delta;
        apply(); remember();
      },
    },
  };
}
