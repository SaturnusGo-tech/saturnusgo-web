"use client";

import MDEditor, { commands } from "@uiw/react-md-editor/nohighlight";
import { useColorMode } from "../../../../../../shared/_hooks/useColorMode";
import css from "./markdownField.module.css";

type Props = {
  value: string;
  label: string;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
  compact?: boolean;
  emptyLabel?: string;
};

const EDIT_COMMANDS = [
  commands.bold,
  commands.italic,
  commands.strikethrough,
  commands.divider,
  commands.title,
  commands.unorderedListCommand,
  commands.orderedListCommand,
  commands.quote,
  commands.link,
  commands.code,
];

function safeUrl(url: string) {
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  return /^(#|\/|\.\/|\.\.\/)/.test(url) ? url : "";
}

export function MarkdownField(props: Props) {
  const { theme } = useColorMode();
  const colorMode = theme === "dark" ? "dark" : "light";
  if (!props.onChange) {
    if (!props.value.trim()) {
      return <p className={css.empty}>{props.emptyLabel}</p>;
    }
    return <MDEditor.Markdown
      className={css.rendered}
      source={props.value}
      skipHtml
      urlTransform={safeUrl}
      wrapperElement={{ "data-color-mode": colorMode }}
    />;
  }
  return <div className={css.field} data-color-mode={colorMode}>
    <MDEditor
      aria-label={props.label}
      value={props.value}
      onChange={(value) => props.onChange?.(value ?? "")}
      preview="edit"
      commands={EDIT_COMMANDS}
      extraCommands={[]}
      visibleDragbar={false}
      height={props.compact ? 96 : 116}
      minHeight={props.compact ? 88 : 104}
      autoFocus={props.autoFocus}
      enableScroll
      previewOptions={{ skipHtml: true, urlTransform: safeUrl }}
      textareaProps={{ "aria-label": props.label }}
    />
  </div>;
}
