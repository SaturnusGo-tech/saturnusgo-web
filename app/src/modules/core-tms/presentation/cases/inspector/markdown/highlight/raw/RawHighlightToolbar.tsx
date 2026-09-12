"use client";

import { Highlighter } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HighlightPalette } from "../palette/HighlightPalette";
import type { HighlightColor } from "../model/highlightColors";
import css from "../toolbar/highlightToolbar.module.css";

type Props = { locale: "ru" | "en"; onChoose: (color: HighlightColor | null) => void; onOpen?: () => void; tabIndex?: number };

export function RawHighlightToolbar(props: Props) {
  const button = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const label = props.locale === "ru" ? "Маркер" : "Highlight";
  useLayoutEffect(() => {
    if (!open || !button.current || !menu.current) return;
    const rect = button.current.getBoundingClientRect();
    menu.current.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 234))}px`;
    menu.current.style.top = `${rect.bottom + 114 > window.innerHeight ? Math.max(8, rect.top - 112) : rect.bottom + 6}px`;
    menu.current.showPopover();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !button.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); button.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", key, true);
    return () => { document.removeEventListener("pointerdown", outside, true); document.removeEventListener("keydown", key, true); };
  }, [open]);
  return <>
    <button ref={button} type="button" tabIndex={props.tabIndex} className={css.trigger}
      title={label} aria-label={label} aria-expanded={open} aria-haspopup="dialog"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => { if (!open) props.onOpen?.(); setOpen((value) => !value); }}><Highlighter size={15} /></button>
    {open && <div ref={menu} className={css.menu} popover="manual" role="dialog" aria-label={label}
      onMouseDown={(event) => event.preventDefault()}>
      <HighlightPalette locale={props.locale} onChoose={(color) => { props.onChoose(color); setOpen(false); }} />
    </div>}
  </>;
}
