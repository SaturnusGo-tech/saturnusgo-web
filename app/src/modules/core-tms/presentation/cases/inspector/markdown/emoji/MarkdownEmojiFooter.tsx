"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { activeEditor$, currentSelection$ } from "@mdxeditor/editor";
import { useCellValues } from "@mdxeditor/gurx";
import { EmojiButton } from "../../../../common/emoji/EmojiButton";
import { MarkdownAttachmentButton } from "../attachments/MarkdownAttachmentUi";
import { captureEmojiTarget } from "./selection/captureEmojiTarget";
import css from "../markdownField.module.css";

type Footer = { locale: "ru" | "en"; onFiles?: (files: File[]) => void;
  render?: (emoji: ReactNode) => ReactNode };
export const MarkdownEmojiFooterContext = createContext<Footer | null>(null);

export function MarkdownEmojiFooter() {
  const config = useContext(MarkdownEmojiFooterContext);
  const [editor, selection] = useCellValues(activeEditor$, currentSelection$);
  const saved = useRef<ReturnType<typeof captureEmojiTarget>>(null);
  if (!config) return null;
  const emoji = <EmojiButton locale={config.locale}
    onOpen={() => { saved.current = editor ? captureEmojiTarget(editor, selection) : null; }}
    onSelect={(value) => saved.current?.apply(value)} />;
  if (config.render) return <>{config.render(emoji)}</>;
  return <div className={css.editorFooter}>{emoji}
    {config.onFiles && <MarkdownAttachmentButton locale={config.locale} onFiles={config.onFiles} />}
  </div>;
}
