"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { PiSmiley } from "react-icons/pi";
import { EmojiPicker } from "./EmojiPicker";
import { hideNativePopover } from "../popup/useAnchoredPopup";
import css from "./emoji.module.css";

export function EmojiButton({ locale, onSelect, onOpen, onOpenChange, disabled = false }: {
  locale: "ru" | "en"; onSelect: (native: string) => void; onOpen?: () => void;
  onOpenChange?: (open: boolean) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false), [closing, setClosing] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null), change = useRef(onOpenChange);
  change.current = onOpenChange;
  const id = useId(), label = locale === "ru" ? "Добавить эмодзи" : "Add emoji";
  const close = useCallback((restore = false) => {
    if (timer.current) return;
    setClosing(true);
    timer.current = setTimeout(() => { setOpen(false); setClosing(false); timer.current = null; change.current?.(false);
      if (restore) trigger.current?.focus({preventScroll:true}); }, 120);
  }, []);
  useLayoutEffect(() => {
    if (!open || !menu.current) return;
    const element = menu.current;
    element.showPopover?.();
    const position = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(352, innerWidth - 24), height = Math.min(426, innerHeight - 24);
      element.style.width = `${width}px`; element.style.maxHeight = `${height}px`;
      element.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - width - 12))}px`;
      element.style.top = `${Math.max(12, rect.bottom + height + 6 > innerHeight ? rect.top - height - 6 : rect.bottom + 6)}px`;
    };
    const outside = (event: PointerEvent) => {
      if (!element.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) close();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); }
    };
    position(); document.addEventListener("pointerdown", outside, true); document.addEventListener("keydown", key, true);
    window.addEventListener("resize", position);
    return () => {
      document.removeEventListener("pointerdown", outside, true); document.removeEventListener("keydown", key, true);
      window.removeEventListener("resize", position);
      hideNativePopover(element);
    };
  }, [open, close]);
  useLayoutEffect(() => () => { if (timer.current) clearTimeout(timer.current); change.current?.(false); }, []);
  return <>
    <button type="button" ref={trigger} className={css.trigger} disabled={disabled} aria-label={label}
      title={label} aria-haspopup="dialog" aria-expanded={open && !closing} aria-controls={open ? id : undefined}
      onPointerDown={(event) => { if (!open) onOpen?.(); event.preventDefault(); }}
      onClick={() => { if (open) close(true); else { onOpen?.(); setOpen(true); change.current?.(true); } }}>
      <PiSmiley size={19} aria-hidden="true" />
    </button>
    {open && <div ref={menu} id={id} popover="manual" role="dialog" aria-label={label}
      className={css.popup} data-closing={closing}>
      <EmojiPicker locale={locale} onSelect={(emoji) => { if (!closing) { onSelect(emoji); close(); } }} />
    </div>}
  </>;
}
