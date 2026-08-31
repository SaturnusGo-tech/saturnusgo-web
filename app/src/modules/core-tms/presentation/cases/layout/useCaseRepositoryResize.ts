import type { CSSProperties, KeyboardEvent, PointerEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  CASE_DETAIL_DEFAULT,
  CASE_DETAIL_MAX,
  CASE_DETAIL_MIN,
  CASE_REPOSITORY_DEFAULT,
  CASE_REPOSITORY_MAX,
  CASE_REPOSITORY_MIN,
  clampCaseDetailPreference,
  clampCaseRepositoryPreference,
  resolveCasePaneWidths,
} from "./caseRepositoryGeometry";

const REPOSITORY_STORAGE_KEY = "tms.cases.repository-width.v2";
const DETAIL_STORAGE_KEY = "tms.cases.detail-width.v2";
export {
  CASE_DETAIL_MAX, CASE_DETAIL_MIN, CASE_REPOSITORY_MAX, CASE_REPOSITORY_MIN,
  clampCaseDetailWidth, clampCaseRepositoryWidth, resolveCasePaneWidths,
} from "./caseRepositoryGeometry";

type ResizeKind = "repository" | "detail";

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
  const preferredWidthRef = useRef(width);
  const preferredDetailWidthRef = useRef(detailWidth);
  const dragRef = useRef<{ kind: ResizeKind; pointerId: number; startX: number; startWidth: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const resizeCommitRef = useRef<number | null>(null);
  const pendingRef = useRef<{ repository: number; detail: number; remember: ResizeKind | null } | null>(null);

  function containerWidth() {
    return containerRef.current?.getBoundingClientRect().width ?? window.innerWidth;
  }
  function update(repository: number, detail: number, commit = true, remember: ResizeKind | null = null) {
    const available = containerWidth();
    if (remember === "repository") {
      repository = clampCaseRepositoryPreference(repository);
      preferredWidthRef.current = repository;
    } else if (remember === "detail") {
      detail = clampCaseDetailPreference(detail);
      preferredDetailWidthRef.current = detail;
    }
    const bounded = resolveCasePaneWidths(repository, detail, available);
    widthRef.current = bounded.repository;
    detailWidthRef.current = bounded.detail;
    containerRef.current?.style.setProperty("--case-repository-width", `${bounded.repository}px`);
    containerRef.current?.style.setProperty("--case-detail-width", `${bounded.detail}px`);
    if (commit) {
      setWidth(bounded.repository);
      setDetailWidth(bounded.detail);
    }
    return bounded;
  }

  function queueUpdate(repository: number, detail: number, remember: ResizeKind | null = null) {
    pendingRef.current = { repository, detail, remember };
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) update(pending.repository, pending.detail, false, pending.remember);
    });
  }

  function flushUpdate() {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) update(pending.repository, pending.detail, false, pending.remember);
    setWidth(widthRef.current);
    setDetailWidth(detailWidthRef.current);
  }

  useEffect(() => {
    preferredWidthRef.current = clampCaseRepositoryPreference(readStoredWidth(REPOSITORY_STORAGE_KEY, CASE_REPOSITORY_DEFAULT));
    preferredDetailWidthRef.current = clampCaseDetailPreference(readStoredWidth(DETAIL_STORAGE_KEY, CASE_DETAIL_DEFAULT));
    update(preferredWidthRef.current, preferredDetailWidthRef.current);
    const target = containerRef.current;
    if (!target || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      queueUpdate(preferredWidthRef.current, preferredDetailWidthRef.current);
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

  function onPointerDown(kind: ResizeKind, event: PointerEvent<HTMLDivElement>) {
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
      drag.kind === "repository" ? drag.startWidth + delta : preferredWidthRef.current,
      drag.kind === "detail" ? drag.startWidth - delta : preferredDetailWidthRef.current,
      drag.kind,
    );
  }

  function finishResize(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    flushUpdate();
    setResizing(false);
    const key = drag.kind === "repository" ? REPOSITORY_STORAGE_KEY : DETAIL_STORAGE_KEY;
    persistWidth(key, drag.kind === "repository" ? preferredWidthRef.current : preferredDetailWidthRef.current);
  }

  function onKeyDown(kind: ResizeKind, event: KeyboardEvent<HTMLDivElement>) {
    const direction = event.key === "ArrowLeft" ? -16 : event.key === "ArrowRight" ? 16 : 0;
    if (!direction && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const minimum = kind === "repository" ? CASE_REPOSITORY_MIN : CASE_DETAIL_MIN;
    const maximum = kind === "repository" ? CASE_REPOSITORY_MAX : CASE_DETAIL_MAX;
    const current = kind === "repository" ? widthRef.current : detailWidthRef.current;
    const arrowStep = kind === "detail" ? -direction : direction;
    const next = event.key === "Home" ? minimum : event.key === "End" ? maximum : current + arrowStep;
    update(
      kind === "repository" ? next : preferredWidthRef.current,
      kind === "detail" ? next : preferredDetailWidthRef.current,
      true,
      kind,
    );
    const value = kind === "repository" ? preferredWidthRef.current : preferredDetailWidthRef.current;
    persistWidth(kind === "repository" ? REPOSITORY_STORAGE_KEY : DETAIL_STORAGE_KEY, value);
  }

  function reset(kind: ResizeKind) {
    update(
      kind === "repository" ? CASE_REPOSITORY_DEFAULT : preferredWidthRef.current,
      kind === "detail" ? CASE_DETAIL_DEFAULT : preferredDetailWidthRef.current,
      true,
      kind,
    );
    const value = kind === "repository" ? preferredWidthRef.current : preferredDetailWidthRef.current;
    persistWidth(kind === "repository" ? REPOSITORY_STORAGE_KEY : DETAIL_STORAGE_KEY, value);
  }

  function handleProps(kind: ResizeKind) {
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
