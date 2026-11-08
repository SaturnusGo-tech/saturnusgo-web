"use client";

import { ProductDocTooltip } from "../../../overlay/ProductDocTooltip";

import { useRef, type PointerEvent, type RefObject } from "react";
import styles from "../image.module.css";

export function ProductDocMediaResize({ media, label, className = styles.resize, canvasSelector = "[data-editor-block-type=image]",
  minWidth = 64, centered = false, onResize, onCommit }: {
  media: RefObject<HTMLElement | null>;
  label: string;
  className?: string;
  canvasSelector?: string;
  minWidth?: number;
  centered?: boolean;
  onResize(width: number | null): void;
  onCommit(width: number | "inherit"): void;
}) {
  const drag = useRef<{ x: number; start: number; max: number; width: number }>(null);

  function bounds() {
    const element = media.current;
    const width = Math.round(element?.getBoundingClientRect().width ?? 0);
    const canvas = element?.closest(canvasSelector);
    const max = Math.min(4096, Math.round(canvas?.getBoundingClientRect().width ?? width));
    return { width, max };
  }

  function clamp(width: number, max: number) {
    return Math.round(Math.min(max, Math.max(Math.min(minWidth, max), width)));
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const resizing = drag.current;
    if (!resizing) return;
    resizing.width = clamp(resizing.start + (event.clientX - resizing.x) * (centered ? 2 : 1), resizing.max);
    onResize(resizing.width);
  }

  return <ProductDocTooltip label={label}><button type="button" className={className} aria-label={label}
    onPointerDown={(event) => {
      if (event.button !== 0) return;
      const { width, max } = bounds();
      if (!width || !max) return;
      event.preventDefault();
      event.stopPropagation();
      drag.current = { x: event.clientX, start: width, max, width };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus({ preventScroll: true });
    }}
    onPointerMove={move}
    onPointerUp={(event) => {
      move(event);
      if (drag.current && drag.current.width !== drag.current.start) onCommit(drag.current.width);
      drag.current = null;
      onResize(null);
    }}
    onLostPointerCapture={() => { drag.current = null; onResize(null); }}
    onKeyDown={(event) => {
      if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const { width, max } = bounds();
      const delta = (event.shiftKey ? 48 : 16) * (event.key === "ArrowLeft" ? -1 : 1);
      if (event.key === "Home") onCommit("inherit");
      else if (width && max) onCommit(clamp(width + delta, max));
    }} /></ProductDocTooltip>;
}
