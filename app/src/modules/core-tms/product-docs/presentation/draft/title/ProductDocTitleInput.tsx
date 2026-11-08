"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ProductDocTitleHighlight } from "../../../domain/product-docs";
import type { TmsLocale } from "../../../../localization/model/locale";
import { RawHighlightToolbar } from "../../../../presentation/cases/inspector/markdown/highlight/raw/RawHighlightToolbar";
import { ProductDocTitleText } from "./ProductDocTitleText";
import { markTitleRange } from "./model/productDocTitleHighlights";
import styles from "../editor.module.css";

export function ProductDocTitleInput({ title, highlights, locale, label, placeholder, disabled, autoFocus, folder, onTitle, onHighlight, onEnter }: {
  title: string;
  highlights: readonly ProductDocTitleHighlight[];
  locale: TmsLocale;
  label: string;
  placeholder: string;
  disabled: boolean;
  autoFocus: boolean;
  folder: boolean;
  onTitle(value: string): void;
  onHighlight(value: ProductDocTitleHighlight[]): void;
  onEnter(): void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const selected = useRef<{ start: number; end: number } | null>(null);
  const [scroll, setScroll] = useState(0);
  useLayoutEffect(() => {
    if (autoFocus || folder) input.current?.focus({ preventScroll: true });
    if (folder) input.current?.select();
  }, [autoFocus, folder]);
  useLayoutEffect(() => { setScroll(input.current?.scrollLeft ?? 0); }, [title, highlights]);
  const field = <input className={styles.titleInput} data-inline-title ref={input} type="text" aria-label={label} placeholder={placeholder}
    maxLength={200} value={title} disabled={disabled}
    onChange={(event) => onTitle(event.currentTarget.value)}
    onScroll={(event) => setScroll(event.currentTarget.scrollLeft)}
    onSelect={(event) => setScroll(event.currentTarget.scrollLeft)}
    onKeyDown={(event) => {
      if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
      event.preventDefault();
      onEnter();
    }} />;
  const marked = !folder && highlights.length > 0;
  return <div className={styles.titleLine}>
    <div className={styles.titleField} data-marked={marked || undefined}>
      {marked && <div className={styles.titleMirror} aria-hidden="true">
        <span style={{ transform: `translateX(${-scroll}px)` }}><ProductDocTitleText title={title} highlights={highlights} /></span>
      </div>}
      {field}
    </div>
    {!folder && <RawHighlightToolbar locale={locale} disabled={disabled || !title.trim()}
      label={locale === "ru" ? "Маркер заголовка" : "Title highlight"}
      onOpen={() => {
        const field = input.current;
        if (!field) return;
        const start = field.selectionStart ?? 0, end = field.selectionEnd ?? 0;
        selected.current = start === end ? { start: 0, end: title.length } : { start, end };
      }}
      onChoose={(color) => {
        const range = selected.current;
        if (!range) return;
        onHighlight(markTitleRange(title, highlights, range.start, range.end, color));
        const field = input.current;
        field?.focus({ preventScroll: true });
        field?.setSelectionRange(range.end, range.end);
      }} />}
  </div>;
}
