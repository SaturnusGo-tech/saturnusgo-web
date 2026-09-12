"use client";

import { Highlighter } from "lucide-react";
import { useHighlightToolbar } from "./useHighlightToolbar";
import { HighlightPalette } from "../palette/HighlightPalette";
import css from "./highlightToolbar.module.css";

export function HighlightToolbar({ locale }: { locale: "ru" | "en" }) {
  const ui = useHighlightToolbar();
  const label = locale === "ru" ? "Маркер" : "Highlight";
  return <>
    <button ref={ui.button} type="button" className={css.trigger} title={label} aria-label={label}
      aria-haspopup="dialog" aria-expanded={ui.open}
      onPointerDown={(event) => { ui.remember(); event.preventDefault(); }}
      onClick={ui.toggle}><Highlighter size={18} strokeWidth={1.75} /></button>
    {ui.open && <div ref={ui.menu} popover="manual" className={css.menu} role="dialog" aria-label={label}
      style={{ top: ui.position.top, left: ui.position.left }}>
      <HighlightPalette locale={locale} onChoose={ui.apply} />
    </div>}
  </>;
}
