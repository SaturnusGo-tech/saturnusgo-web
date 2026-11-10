"use client";

import { Button } from "@heroui/react";
import { Minus, Plus, Scan } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./diagram-viewer.module.css";

export interface DiagramImage {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

const padding = 24;
const minZoom = 0.01;
const maxZoom = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ProductDocDiagramViewer({ image, label, ru, expanded }: {
  image: DiagramImage; label: string; ru: boolean; expanded?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const anchor = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | "reset" | null>(null);
  const scaleRef = useRef(1);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState<number | "fit">();
  const widthRatio = size.width ? (size.width - padding) / image.width : 1;
  const heightRatio = expanded && size.height ? (size.height - padding) / image.height : 1;
  const fitScale = Math.min(1, widthRatio, heightRatio);
  const displayScale = clamp(
    zoom === "fit" ? fitScale : zoom ?? (expanded ? fitScale : Math.max(0.75, fitScale)),
    minZoom, maxZoom,
  );

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth;
      const height = expanded ? element.clientHeight : 0;
      setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded]);

  useLayoutEffect(() => {
    scaleRef.current = displayScale;
    const element = viewport.current;
    const graphic = picture.current;
    const point = anchor.current;
    anchor.current = null;
    if (!element || !graphic || !point) return;
    if (point === "reset") {
      element.scrollTo(0, 0);
      return;
    }
    const bounds = graphic.getBoundingClientRect();
    const frame = element.getBoundingClientRect();
    element.scrollBy(
      bounds.left + point.x * bounds.width - frame.left - point.offsetX,
      expanded ? bounds.top + point.y * bounds.height - frame.top - point.offsetY : 0,
    );
  }, [displayScale, expanded, zoom]);

  const changeZoom = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const element = viewport.current;
    const graphic = picture.current;
    const next = clamp(scaleRef.current * factor, minZoom, maxZoom);
    if (!element || !graphic || next === scaleRef.current) return;
    const bounds = graphic.getBoundingClientRect();
    const frame = element.getBoundingClientRect();
    const offsetX = clientX === undefined ? element.clientWidth / 2 : clientX - frame.left;
    const offsetY = clientY === undefined ? element.clientHeight / 2 : clientY - frame.top;
    anchor.current = {
      x: clamp((frame.left + offsetX - bounds.left) / bounds.width, 0, 1),
      y: clamp((frame.top + offsetY - bounds.top) / bounds.height, 0, 1),
      offsetX,
      offsetY,
    };
    scaleRef.current = next;
    setZoom(next);
  }, []);

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    // Chromium sends trackpad pinch as a cancelable Ctrl+wheel event.
    const pinch = (event: WheelEvent) => {
      if (!event.ctrlKey || !event.cancelable) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1);
      changeZoom(Math.exp(-clamp(delta, -100, 100) / 100), event.clientX, event.clientY);
    };
    element.addEventListener("wheel", pinch, { passive: false });
    return () => element.removeEventListener("wheel", pinch);
  }, [changeZoom]);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const element = event.currentTarget;
    if (element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight) return;
    // Leave the native scrollbars available for direct manipulation.
    const bounds = element.getBoundingClientRect();
    if (event.clientX - bounds.left >= element.clientWidth || event.clientY - bounds.top >= element.clientHeight) return;
    drag.current = { x: event.clientX, y: event.clientY, left: element.scrollLeft, top: element.scrollTop };
    element.setPointerCapture(event.pointerId);
    element.dataset.dragging = "true";
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start) return;
    const element = event.currentTarget;
    element.scrollLeft = start.left + start.x - event.clientX;
    element.scrollTop = start.top + start.y - event.clientY;
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
  }

  const zoomOut = ru ? "Уменьшить" : "Zoom out";
  const zoomIn = ru ? "Увеличить" : "Zoom in";
  const fit = expanded
    ? ru ? "Показать целиком" : "Fit diagram"
    : ru ? "По ширине" : "Fit width";
  return <div className={styles.viewer} data-expanded={expanded || undefined}>
    <div className={styles.toolbar} role="group" aria-label={ru ? "Масштаб диаграммы" : "Diagram zoom"}>
      <Button size="sm" isIconOnly disableRipple variant="light" className={styles.button} aria-label={zoomOut}
        isDisabled={displayScale <= minZoom} onPress={() => changeZoom(0.8)}>
        <Minus size={14} aria-hidden="true" />
      </Button>
      <output className={styles.scale}>{Math.round(displayScale * 100)}%</output>
      <Button size="sm" isIconOnly disableRipple variant="light" className={styles.button} aria-label={zoomIn}
        isDisabled={displayScale >= maxZoom} onPress={() => changeZoom(1.25)}>
        <Plus size={14} aria-hidden="true" />
      </Button>
      <Button size="sm" disableRipple variant="light" className={`${styles.button} ${styles.fit}`}
        aria-pressed={zoom === "fit"} onPress={() => {
          if (zoom === "fit") return;
          anchor.current = "reset";
          setZoom("fit");
        }}>
        <Scan size={14} aria-hidden="true" />{fit}
      </Button>
    </div>
    <div ref={viewport} className={styles.viewport} role="region" aria-label={label} tabIndex={0}
      onPointerDown={startDrag} onPointerMove={moveDrag} onLostPointerCapture={stopDrag}
      onKeyDown={event => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End"].includes(event.key)) {
          event.stopPropagation();
        }
      }}>
      <div className={styles.stage}>
        {/* SVG is loaded in the browser's isolated image context. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={picture} draggable={false} src={image.url} alt={label} className={styles.graphic}
          style={{ width: image.width * displayScale, height: image.height * displayScale }} />
      </div>
    </div>
  </div>;
}
