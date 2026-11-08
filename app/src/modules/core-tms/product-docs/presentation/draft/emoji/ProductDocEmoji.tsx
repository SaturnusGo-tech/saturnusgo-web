"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { activeEditor$, currentSelection$, readOnly$, rootEditor$ } from "@mdxeditor/editor";
import { useCellValues } from "@mdxeditor/gurx";
import { useRef, useState } from "react";
import { PiSmiley } from "react-icons/pi";
import { captureEmojiTarget } from "../../../../presentation/cases/inspector/markdown/emoji/selection/captureEmojiTarget";
import { EmojiPicker } from "../../../../presentation/common/emoji/EmojiPicker";
import { ProductDocToolbarButton } from "../toolbar/menu/ProductDocToolbarMenu";
import styles from "./product-doc-emoji.module.css";

export function ProductDocEmoji({ locale }: { locale: "ru" | "en" }) {
  const [activeEditor, rootEditor, selection, readOnly] = useCellValues(activeEditor$, rootEditor$, currentSelection$, readOnly$);
  const editor = activeEditor ?? rootEditor;
  const trigger = useRef<HTMLButtonElement>(null);
  const target = useRef<ReturnType<typeof captureEmojiTarget>>(null);
  const [open, setOpen] = useState(false);
  const label = locale === "ru" ? "Добавить эмодзи" : "Add emoji";
  const remember = () => { target.current = editor ? captureEmojiTarget(editor, selection) : null; };

  return <Popover isOpen={open} onOpenChange={(next) => {
    if (next && !target.current) remember();
    if (!next) target.current = null;
    setOpen(next);
  }} placement="bottom-start" offset={6} shouldBlockScroll={false} shouldCloseOnScroll={false}
    classNames={{ base: styles.positioner, content: styles.panel }}>
    <PopoverTrigger>
      <ProductDocToolbarButton ref={trigger} label={label} isIconOnly isDisabled={readOnly || !editor}
        onPointerDownCapture={remember} onMouseDown={(event) => event.preventDefault()}>
        <PiSmiley size={18} aria-hidden="true" />
      </ProductDocToolbarButton>
    </PopoverTrigger>
    <PopoverContent data-editor-dialog aria-label={label} onKeyDownCapture={(event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      target.current = null;
      setOpen(false);
      requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
    }}>
      <EmojiPicker locale={locale} dynamicWidth onSelect={(emoji) => {
        target.current?.apply(emoji);
        target.current = null;
        setOpen(false);
      }} />
    </PopoverContent>
  </Popover>;
}
