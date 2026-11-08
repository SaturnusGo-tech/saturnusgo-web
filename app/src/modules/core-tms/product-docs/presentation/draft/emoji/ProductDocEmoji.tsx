"use client";

import { activeEditor$, currentSelection$, readOnly$, rootEditor$ } from "@mdxeditor/editor";
import { useCellValues } from "@mdxeditor/gurx";
import { useRef } from "react";
import { captureEmojiTarget } from "../../../../presentation/cases/inspector/markdown/emoji/selection/captureEmojiTarget";
import { EmojiButton } from "../../../../presentation/common/emoji/EmojiButton";

export function ProductDocEmoji({ locale }: { locale: "ru" | "en" }) {
  const [activeEditor, rootEditor, selection, readOnly] = useCellValues(activeEditor$, rootEditor$, currentSelection$, readOnly$);
  const editor = activeEditor ?? rootEditor;
  const target = useRef<ReturnType<typeof captureEmojiTarget>>(null);

  return <EmojiButton locale={locale} disabled={readOnly || !editor}
    onOpen={() => { target.current = editor ? captureEmojiTarget(editor, selection) : null; }}
    onOpenChange={(open) => { if (!open) target.current = null; }}
    onSelect={(emoji) => target.current?.apply(emoji)} />;
}
