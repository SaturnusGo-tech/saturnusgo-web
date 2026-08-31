import type { CSSProperties, KeyboardEvent, PointerEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";

export const CASE_REPOSITORY_DEFAULT = 230;
export const CASE_REPOSITORY_MIN = 230;
export const CASE_REPOSITORY_MAX = 320;
export const CASE_DETAIL_DEFAULT = 510;
export const CASE_DETAIL_MIN = 340;
export const CASE_DETAIL_MAX = 680;
export const CASE_LIST_MIN = 420;
export const CASE_REPOSITORY_VISIBLE_MIN = CASE_REPOSITORY_MIN + CASE_LIST_MIN;
export const CASE_INLINE_MIN = 1090;
const CASE_DOCUMENT_MIN = CASE_LIST_MIN;
const REPOSITORY_STORAGE_KEY = "tms.cases.repository-width.v1";
const DETAIL_STORAGE_KEY = "tms.cases.detail-width.v2";
export function clampCaseRepositoryWidth(value: number, containerWidth: number) {
  const available = containerWidth > 0
    ? Math.max(CASE_REPOSITORY_MIN, containerWidth - CASE_DOCUMENT_MIN)
    : CASE_REPOSITORY_MAX;
  return Math.round(Math.min(Math.max(value, CASE_REPOSITORY_MIN), CASE_REPOSITORY_MAX, available));
}
export function clampCaseDetailWidth(value: number, containerWidth: number, repositoryWidth: number) {
  const available = containerWidth >= CASE_INLINE_MIN
    ? Math.max(CASE_DETAIL_MIN, containerWidth - repositoryWidth - CASE_LIST_MIN)
    : CASE_DETAIL_MAX;
  return Math.round(Math.min(Math.max(value, CASE_DETAIL_MIN), CASE_DETAIL_MAX, available));
}

function readStoredWidth(key: string, fallback: number) {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function persistWidth(key: string, value: number) {
  try { window.localStorage.setItem(key, String(value)); } catch { /* Storage can be unavailable. */ }
}
export function useCaseRepositoryResize(containerRef: RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(CASE_REPOSITORY_DEFAULT);
  const [detailWidth, setDetailWidth] = useState(CASE_DETAIL_DEFAULT);
  const [resizing, setResizing] = useState(false);
  const widthRef = useRef(width);
  const detailWidthRef = useRef(detailWidth);
  const dragRef = useRef<{ kind: "repository" | "detail"; pointerId: number; startX: number; startWidth: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const resizeCommitRef = useRef<number | null>(null);
  const pendingRef = useRef<{ repository: number; detail: number } | null>(null);

  function containerWidth() {
    return containerRef.current?.getBoundingClientRect().width ?? window.innerWidth;
  }
  function update(repository: number, detail: number, commit = true) {
    const available = containerWidth();
    let boundedRepository = clampCaseRepositoryWidth(repository, available);
    if (available >= CASE_REPOSITORY_VISIBLE_MIN) {
      boundedRepository = Math.min(
        boundedRepository,
        Math.max(
          CASE_REPOSITORY_MIN,
          available - CASE_LIST_MIN - (available >= CASE_INLINE_MIN ? CASE_DETAIL_MIN : 0),
        ),
      );
    }
    const boundedDetail = clampCaseDetailWidth(detail, available, boundedRepository);
    widthRef.current = boundedRepository;
    detailWidthRef.current = boundedDetail;
    containerRef.current?.style.setProperty("--case-repository-width", `${boundedRepository}px`);
    containerRef.current?.style.setProperty("--case-detail-width", `${boundedDetail}px`);
    if (commit) {
      setWidth(boundedRepository);
      setDetailWidth(boundedDetail);
    }
    return { repository: boundedRepository, detail: boundedDetail };
  }

  function queueUpdate(repository: number, detail: number) {
    pendingRef.current = { repository, detail };
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) update(pending.repository, pending.detail, false);
    });
  }

  function flushUpdate() {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) update(pending.repository, pending.detail, false);
    setWidth(widthRef.current);
    setDetailWidth(detailWidthRef.current);
  }

  useEffect(() => {
    update(
      readStoredWidth(REPOSITORY_STORAGE_KEY, CASE_REPOSITORY_DEFAULT),
      readStoredWidth(DETAIL_STORAGE_KEY, CASE_DETAIL_DEFAULT),
    );
    const target = containerRef.current;
    if (!target || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      queueUpdate(widthRef.current, detailWidthRef.current);
      if (resizeCommitRef.current !== null) window.clearTimeout(resizeCommitRef.current);
      resizeCommitRef.current = window.setTimeout(flushUpdate, 180);
    });
    observer.observe(target);
    return () => {
      observer.disconnect();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      if (resizeCommitRef.current !== null) window.clearTimeout(resizeCommitRef.current);
    };
  }, []);

  function onPointerDown(kind: "repository" | "detail", event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    dragRef.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: kind === "repository" ? widthRef.current : detailWidthRef.current,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    setResizing(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    queueUpdate(
      drag.kind === "repository" ? drag.startWidth + delta : widthRef.current,
      drag.kind === "detail" ? drag.startWidth - delta : detailWidthRef.current,
    );
  }

  function finishResize(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    flushUpdate();
    setResizing(false);
    const key = drag.kind === "repository" ? REPOSITORY_STORAGE_KEY : DETAIL_STORAGE_KEY;
    persistWidth(key, drag.kind === "repository" ? widthRef.current : detailWidthRef.current);
  }

  function onKeyDown(kind: "repository" | "detail", event: KeyboardEvent<HTMLDivElement>) {
    const direction = event.key === "ArrowLeft" ? -16 : event.key === "ArrowRight" ? 16 : 0;
    if (!direction && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const minimum = kind === "repository" ? CASE_REPOSITORY_MIN : CASE_DETAIL_MIN;
    const maximum = kind === "repository" ? CASE_REPOSITORY_MAX : CASE_DETAIL_MAX;
    const current = kind === "repository" ? widthRef.current : detailWidthRef.current;
    const arrowStep = kind === "detail" ? -direction : direction;
    const next = event.key === "Home" ? minimum : event.key === "End" ? maximum : current + arrowStep;
    const bounded = update(kind === "repository" ? next : widthRef.current, kind === "detail" ? next : detailWidthRef.current);
    const value = kind === "repository" ? bounded.repository : bounded.detail;
    persistWidth(kind === "repository" ? REPOSITORY_STORAGE_KEY : DETAIL_STORAGE_KEY, value);
  }

  function reset(kind: "repository" | "detail") {
    const bounded = update(
      kind === "repository" ? CASE_REPOSITORY_DEFAULT : widthRef.current,
      kind === "detail" ? CASE_DETAIL_DEFAULT : detailWidthRef.current,
    );
    const value = kind === "repository" ? bounded.repository : bounded.detail;
    persistWidth(kind === "repository" ? REPOSITORY_STORAGE_KEY : DETAIL_STORAGE_KEY, value);
  }

  function handleProps(kind: "repository" | "detail") {
    return {
      onDoubleClick: () => reset(kind),
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => onKeyDown(kind, event),
      onPointerCancel: finishResize,
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => onPointerDown(kind, event),
      onPointerMove,
      onPointerUp: finishResize,
    };
  }

  return {
    width,
    detailWidth,
    resizing,
    style: {
      "--case-repository-width": `${width}px`,
      "--case-detail-width": `${detailWidth}px`,
    } as CSSProperties,
    handleProps: handleProps("repository"),
    detailHandleProps: handleProps("detail"),
  };
}
