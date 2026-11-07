import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

const guideWidthKey = "falcon.integration-guide.width.v1";
const minWidth = 320;
const minWorkspaceWidth = 320;
const desktopQuery = "(min-width: 761px)";

export function useGuidePanelWidth(contentRef?: RefObject<HTMLDivElement | null>, preferredWidthKey = guideWidthKey) {
  const preference = useRef<number | null>(null);
  const drag = useRef<{ id: number; x: number; width: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, workspace: 0, desktop: false });

  useLayoutEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(preferredWidthKey));
      if (Number.isFinite(saved) && saved >= minWidth) preference.current = saved;
    } catch { /* Resizing works without storage. */ }
    const desktop = window.matchMedia(desktopQuery);
    const workspace = contentRef?.current?.parentElement;
    const measure = () => {
      const width = document.documentElement.clientWidth;
      setViewport({ width, workspace: workspace?.clientWidth ?? width, desktop: desktop.matches });
    };
    measure();
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (workspace) observer?.observe(workspace);
    return () => { window.removeEventListener("resize", measure); observer?.disconnect(); };
  }, [contentRef, preferredWidthKey]);

  const maxWidth = Math.max(minWidth, viewport.workspace - minWorkspaceWidth);
  const clamp = (next: number) => Math.round(Math.max(minWidth, Math.min(next, maxWidth)));
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const width = clamp(customWidth ?? preference.current ?? viewport.width / 2);
  const setWidth = (next: number | null) => {
    preference.current = next;
    setCustomWidth(next);
  };
  const remember = () => {
    try {
      if (preference.current === null) window.localStorage.removeItem(preferredWidthKey);
      else window.localStorage.setItem(preferredWidthKey, String(preference.current));
    } catch { /* Keep the current selection for this session. */ }
  };
  const finish = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    remember();
  };

  return { width, dragging, desktop: viewport.desktop, minWidth, maxWidth, handleProps: {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (event.button !== 0 || drag.current) return;
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { id: event.pointerId, x: event.clientX, width };
      setDragging(true);
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      if (drag.current?.id !== event.pointerId) return;
      setWidth(clamp(drag.current.width + drag.current.x - event.clientX));
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
    onDoubleClick() { setWidth(null); remember(); },
    onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      const delta = event.key === "ArrowLeft" ? 24 : event.key === "ArrowRight" ? -24 : 0;
      if (!delta && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      setWidth(clamp(event.key === "Home" ? minWidth : event.key === "End" ? maxWidth : width + delta));
      remember();
    },
  } };
}
