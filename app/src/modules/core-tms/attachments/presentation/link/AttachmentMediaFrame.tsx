"use client";

import {
  ChevronDown, ChevronRight, ExternalLink, GripVertical, Trash2,
} from "lucide-react";
import {
  useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent,
} from "react";
import css from "./attachmentMediaFrame.module.css";

type Props = {
  name: string;
  detail?: string;
  source: string;
  mediaType: "image" | "video";
  locale: "en" | "ru";
  variant?: "scenario" | "gallery";
  defaultExpanded?: boolean;
  loading?: boolean;
  removing?: boolean;
  onOpen?: () => void;
  onRemove?: () => void;
};

const MIN_WIDTH = 220;

export function AttachmentMediaFrame({
  name, detail, source, mediaType, locale, variant = "scenario", defaultExpanded = true,
  loading = false, removing = false, onOpen, onRemove,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [width, setWidth] = useState(variant === "gallery" ? 520 : 430);
  const [resizing, setResizing] = useState(false);
  const frameRef = useRef<HTMLElement>(null);
  const ru = locale === "ru";

  function clampWidth(next: number) {
    const available = frameRef.current?.parentElement?.getBoundingClientRect().width ?? next;
    return Math.max(Math.min(MIN_WIDTH, available), Math.min(next, available));
  }

  function resizeBy(delta: number) {
    setWidth((current) => clampWidth(current + delta));
  }

  function startResize(side: "left" | "right", event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = frameRef.current?.getBoundingClientRect().width ?? width;
    setResizing(true);
    const move = (moveEvent: globalThis.PointerEvent) => {
      const rawDelta = moveEvent.clientX - startX;
      setWidth(clampWidth(startWidth + (side === "right" ? rawDelta : -rawDelta)));
    };
    const stop = () => {
      setResizing(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, side: "left" | "right") {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    resizeBy(direction * (side === "right" ? 24 : -24));
  }

  const style = { "--attachment-media-width": `${width}px` } as CSSProperties;
  return <figure ref={frameRef} className={css.frame} style={style}
    data-variant={variant} data-collapsed={!expanded || undefined} data-resizing={resizing || undefined}>
    <figcaption className={css.header}>
      <button type="button" className={css.disclosure} onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded} aria-label={expanded
          ? (ru ? "Скрыть вложение" : "Collapse attachment")
          : (ru ? "Показать вложение" : "Expand attachment")}>
        {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      <span className={css.identity} title={name}>
        <b>{name}</b>{detail && <small>{detail}</small>}
      </span>
      <span className={css.actions}>
        {onOpen && <button type="button" onClick={onOpen} disabled={loading}
          aria-label={ru ? "Открыть в полном размере" : "Open full size"}
          title={ru ? "Открыть в полном размере" : "Open full size"}>
          <ExternalLink size={14} />
        </button>}
        {onRemove && <button type="button" onClick={onRemove} disabled={removing}
          aria-label={`${ru ? "Удалить" : "Remove"} ${name}`} title={ru ? "Удалить" : "Remove"}>
          <Trash2 size={14} />
        </button>}
      </span>
    </figcaption>
    <div className={css.collapse} aria-hidden={!expanded}>
      <div className={css.collapseInner}>
        <div className={css.mediaBody}>
          {source
            ? mediaType === "image"
              ? <img src={source} alt={name} />
              : <video src={source} controls preload="metadata" aria-label={name} />
            : <span className={css.loading}>{ru ? "Загрузка превью…" : "Loading preview…"}</span>}
          <button type="button" className={`${css.resizeHandle} ${css.leftHandle}`}
            aria-label={ru ? "Изменить размер слева" : "Resize from left"}
            onPointerDown={(event) => startResize("left", event)}
            onKeyDown={(event) => resizeWithKeyboard(event, "left")}>
            <GripVertical size={16} />
          </button>
          <button type="button" className={`${css.resizeHandle} ${css.rightHandle}`}
            aria-label={ru ? "Изменить размер справа" : "Resize from right"}
            onPointerDown={(event) => startResize("right", event)}
            onKeyDown={(event) => resizeWithKeyboard(event, "right")}>
            <GripVertical size={16} />
          </button>
        </div>
      </div>
    </div>
  </figure>;
}
