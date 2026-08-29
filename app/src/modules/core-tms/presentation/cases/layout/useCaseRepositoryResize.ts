import type { CSSProperties, KeyboardEvent, PointerEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";

export const CASE_REPOSITORY_DEFAULT = 344;
export const CASE_REPOSITORY_MIN = 248;
const CASE_REPOSITORY_MAX = 560;
const CASE_DOCUMENT_MIN = 520;
const STORAGE_KEY = "tms.cases.repository-width.v1";

export function clampCaseRepositoryWidth(value: number, containerWidth: number) {
  const available = containerWidth > 0
    ? Math.max(CASE_REPOSITORY_MIN, containerWidth - CASE_DOCUMENT_MIN)
    : CASE_REPOSITORY_MAX;
  return Math.round(Math.min(Math.max(value, CASE_REPOSITORY_MIN), CASE_REPOSITORY_MAX, available));
}

export function useCaseRepositoryResize(containerRef: RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(CASE_REPOSITORY_DEFAULT);
  const [resizing, setResizing] = useState(false);
  const [ready, setReady] = useState(false);
  const widthRef = useRef(width);
  const dragRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  function containerWidth() {
    return containerRef.current?.getBoundingClientRect().width ?? window.innerWidth;
  }
  function update(next: number) {
    const bounded = clampCaseRepositoryWidth(next, containerWidth());
    widthRef.current = bounded;
    setWidth(bounded);
    return bounded;
  }
  function persist(next = widthRef.current) {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  }

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(saved) && saved > 0) update(saved);
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: widthRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    update(drag.startWidth + event.clientX - drag.startX);
  }
  function finishResize(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setResizing(false);
    persist();
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const direction = event.key === "ArrowLeft" ? -16 : event.key === "ArrowRight" ? 16 : 0;
    if (!direction && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home"
      ? CASE_REPOSITORY_MIN
      : event.key === "End"
        ? CASE_REPOSITORY_MAX
        : widthRef.current + direction;
    persist(update(next));
  }
  function reset() {
    persist(update(CASE_REPOSITORY_DEFAULT));
  }

  return {
    width,
    resizing,
    ready,
    style: { "--case-repository-width": `${width}px` } as CSSProperties,
    handleProps: {
      onDoubleClick: reset,
      onKeyDown,
      onPointerCancel: finishResize,
      onPointerDown,
      onPointerMove,
      onPointerUp: finishResize,
    },
  };
}
