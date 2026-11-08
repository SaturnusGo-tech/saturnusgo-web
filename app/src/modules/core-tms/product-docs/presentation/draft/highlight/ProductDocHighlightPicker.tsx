"use client";

import { Popover, PopoverContent } from "@heroui/react";
import { Highlighter } from "lucide-react";
import { useRef, useState } from "react";
import type { HighlightColor } from "../../../../presentation/cases/inspector/markdown/highlight/model/highlightColors";
import { HighlightPalette } from "../../../../presentation/cases/inspector/markdown/highlight/palette/HighlightPalette";
import { ProductDocToolbarButton } from "../toolbar/menu/ProductDocToolbarMenu";
import styles from "./product-doc-highlight.module.css";

type Props = {
  locale: "en" | "ru";
  onChoose(color: HighlightColor | null): void;
  onOpen?(): void;
  label?: string;
  disabled?: boolean;
  portalContainer?: HTMLElement;
};

export function ProductDocHighlightPicker({ locale, onChoose, onOpen, disabled, portalContainer, ...props }: Props) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null!);
  const choice = useRef<{ color: HighlightColor | null }>(null);
  function remember() {
    if (!choice.current) onOpen?.();
  }
  const label = props.label ?? (locale === "ru" ? "Маркер" : "Highlight");
  return <Popover triggerRef={trigger} isOpen={open && !disabled} onOpenChange={setOpen} placement="bottom-start" offset={6}
    shouldBlockScroll={false} shouldCloseOnBlur={false} shouldCloseOnScroll={false} portalContainer={portalContainer}
    classNames={{ base: styles.positioner, content: styles.palette }}
    motionProps={{ onAnimationComplete: (variant) => {
      if (variant !== "exit" || !choice.current) return;
      const { color } = choice.current;
      // Restore the editor selection after the overlay releases its focus scope.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        choice.current = null;
        onChoose(color);
      }));
    } }}>
    <ProductDocToolbarButton ref={trigger} label={label} isIconOnly isDisabled={disabled} className={styles.trigger}
      aria-haspopup="dialog" aria-expanded={open && !disabled}
      onPointerDownCapture={remember} onMouseDown={(event) => event.preventDefault()}
      onKeyDownCapture={(event) => { if (event.key === "Enter" || event.key === " ") remember(); }}
      onPress={() => { if (!choice.current) setOpen((value) => !value); }}>
      <Highlighter size={15} aria-hidden="true" />
    </ProductDocToolbarButton>
    <PopoverContent aria-label={label} data-editor-dialog>
      <HighlightPalette locale={locale} onChoose={(color) => {
        if (choice.current) return;
        choice.current = { color };
        setOpen(false);
      }} />
    </PopoverContent>
  </Popover>;
}
