"use client";

import { Button } from "@heroui/react";
import { Minus, Plus, Scan } from "lucide-react";
import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./diagram-viewer.module.css";

export interface DiagramImage {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

export function ProductDocDiagramViewer({ image, label, ru, expanded }: {
  image: DiagramImage; label: string; ru: boolean; expanded?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const anchor = useRef<{ x: number; y: number } | "reset" | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState<number | "fit">();
  const widthRatio = size.width ? (size.width - 24) / image.width : 1;
  const scale = zoom === "fit"
    ? Math.min(1, widthRatio, size.height ? (size.height - 24) / image.height : 1)
    : zoom ?? Math.min(1, Math.max(0.75, widthRatio));
  const displayScale = Math.max(0.01, scale);

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
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
      bounds.left + point.x * bounds.width - frame.left - element.clientWidth / 2,
      bounds.top + point.y * bounds.height - frame.top - element.clientHeight / 2,
    );
  }, [displayScale, zoom]);

  function changeZoom(factor: number) {
    const next = Math.min(3, Math.max(0.1, displayScale * factor));
    if (next === zoom) return;
    const bounds = picture.current?.getBoundingClientRect();
    const frame = viewport.current?.getBoundingClientRect();
    if (bounds && frame) {
      anchor.current = {
        x: Math.max(0, Math.min(1, (frame.left + frame.width / 2 - bounds.left) / bounds.width)),
        y: Math.max(0, Math.min(1, (frame.top + frame.height / 2 - bounds.top) / bounds.height)),
      };
    }
    setZoom(next);
  }

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
  const fit = ru ? "Показать целиком" : "Fit diagram";
  return <div className={styles.viewer} data-expanded={expanded || undefined}>
    <div ref={viewport} className={styles.viewport} role="region" aria-label={label} tabIndex={0}
      style={expanded ? undefined : { blockSize: Math.max(64, image.height + 24) }}
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
    <div className={styles.toolbar} role="group" aria-label={ru ? "Масштаб диаграммы" : "Diagram zoom"}>
      <Button size="sm" isIconOnly disableRipple variant="light" className={styles.button} aria-label={zoomOut}
        isDisabled={displayScale <= 0.1} onPress={() => changeZoom(0.8)}>
        <Minus size={14} aria-hidden="true" />
      </Button>
      <output className={styles.scale}>{Math.round(displayScale * 100)}%</output>
      <Button size="sm" isIconOnly disableRipple variant="light" className={styles.button} aria-label={zoomIn}
        isDisabled={displayScale >= 3} onPress={() => changeZoom(1.25)}>
        <Plus size={14} aria-hidden="true" />
      </Button>
      <Button size="sm" isIconOnly disableRipple variant="light" className={styles.button} aria-label={fit} title={fit}
        aria-pressed={zoom === "fit"} onPress={() => {
          if (zoom === "fit") return;
          anchor.current = "reset";
          setZoom("fit");
        }}>
        <Scan size={14} aria-hidden="true" />
      </Button>
    </div>
  </div>;
}
