"use client";

import { useRef, type PointerEvent, type RefObject } from "react";
import styles from "../image.module.css";

export function ProductDocImageResize({ image, ru, onResize, onCommit }: {
  image: RefObject<HTMLImageElement | null>;
  ru: boolean;
  onResize(width: number | null): void;
  onCommit(width: number | "inherit"): void;
}) {
  const drag = useRef<{ x: number; start: number; max: number; width: number }>(null);

  function bounds() {
    const media = image.current;
    const width = Math.round(media?.getBoundingClientRect().width ?? 0);
    const canvas = media?.closest("[data-editor-block-type=image]");
    const max = Math.min(4096, Math.round(canvas?.getBoundingClientRect().width ?? width));
    return { width, max };
  }

  function clamp(width: number, max: number) {
    return Math.round(Math.min(max, Math.max(64, width)));
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const resizing = drag.current;
    if (!resizing) return;
    resizing.width = clamp(resizing.start + event.clientX - resizing.x, resizing.max);
    onResize(resizing.width);
  }

  const label = ru ? "Изменить размер изображения" : "Resize image";
  return <button type="button" className={styles.resize} title={label} aria-label={label}
    onPointerDown={(event) => {
      if (event.button !== 0) return;
      const { width, max } = bounds();
      if (!width || !max) return;
      event.preventDefault();
      event.stopPropagation();
      drag.current = { x: event.clientX, start: width, max, width };
      event.currentTarget.setPointerCapture(event.pointerId);
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
    }} />;
}
