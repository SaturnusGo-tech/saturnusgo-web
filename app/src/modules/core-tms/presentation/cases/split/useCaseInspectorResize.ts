import type { CSSProperties, KeyboardEvent, PointerEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  CASE_INSPECTOR_DEFAULT,
  CASE_INSPECTOR_MAX,
  CASE_INSPECTOR_MIN,
  clampCaseInspectorPreference,
  resolveCaseInspectorWidth,
} from "./caseInspectorGeometry";

const STORAGE_KEY = "tms.cases.inspector-width.v1";
const OVERLAY_BREAKPOINT = 959;

function readPreference() {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value > 0
      ? clampCaseInspectorPreference(value)
      : CASE_INSPECTOR_DEFAULT;
  } catch {
    return CASE_INSPECTOR_DEFAULT;
  }
}

function storePreference(value: number) {
  try { window.localStorage.setItem(STORAGE_KEY, String(value)); } catch { /* Storage can be unavailable. */ }
}

export function useCaseInspectorResize(containerRef: RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(CASE_INSPECTOR_DEFAULT);
  const [resizing, setResizing] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const preferredRef = useRef(CASE_INSPECTOR_DEFAULT);
  const widthRef = useRef(CASE_INSPECTOR_DEFAULT);
  const frameRef = useRef<number | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  function containerWidth() {
    return containerRef.current?.getBoundingClientRect().width ?? window.innerWidth;
  }

  function apply(preference: number, commit: boolean, remember: boolean) {
    const nextPreference = remember ? clampCaseInspectorPreference(preference) : preference;
    if (remember) preferredRef.current = nextPreference;
    const measuredWidth = containerWidth();
    const next = resolveCaseInspectorWidth(nextPreference, measuredWidth);
    setOverlay(measuredWidth <= OVERLAY_BREAKPOINT);
    widthRef.current = next;
    containerRef.current?.style.setProperty("--case-inspector-width", `${next}px`);
    if (commit) setWidth(next);
  }

  function queue(preference: number) {
    preferredRef.current = clampCaseInspectorPreference(preference);
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      apply(preferredRef.current, false, false);
    });
  }

  function flush() {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    apply(preferredRef.current, false, false);
    setWidth(widthRef.current);
  }

  useEffect(() => {
    preferredRef.current = readPreference();
    apply(preferredRef.current, true, false);
    const target = containerRef.current;
    if (!target || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => apply(preferredRef.current, true, false));
    observer.observe(target);
    return () => {
      observer.disconnect();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  function finish(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    flush();
    storePreference(preferredRef.current);
    setResizing(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const delta = event.key === "ArrowLeft" ? 16 : event.key === "ArrowRight" ? -16 : 0;
    if (!delta && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home"
      ? CASE_INSPECTOR_MIN
      : event.key === "End"
      ? CASE_INSPECTOR_MAX
      : preferredRef.current + delta;
    apply(next, true, true);
    storePreference(preferredRef.current);
  }

  const handleProps = {
    onDoubleClick: () => {
      apply(CASE_INSPECTOR_DEFAULT, true, true);
      storePreference(preferredRef.current);
    },
    onKeyDown,
    onPointerCancel: finish,
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: preferredRef.current };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
      setResizing(true);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      queue(drag.startWidth - (event.clientX - drag.startX));
    },
    onPointerUp: finish,
  };

  return {
    handleProps,
    overlay,
    resizing,
    style: { "--case-inspector-width": `${width}px` } as CSSProperties,
    width,
  };
}

export { CASE_INSPECTOR_MAX, CASE_INSPECTOR_MIN } from "./caseInspectorGeometry";
