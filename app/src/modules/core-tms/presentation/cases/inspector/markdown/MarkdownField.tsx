"use client";

import MDEditor from "@uiw/react-md-editor/nohighlight";
import dynamic from "next/dynamic";
import { useColorMode } from "../../../../../../shared/_hooks/useColorMode";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import css from "./markdownField.module.css";

type Props = {
  value: string;
  label: string;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
  compact?: boolean;
  emptyLabel?: string;
};

const WysiwygMarkdownEditor = dynamic(
  () => import("./InitializedMarkdownEditor"),
  { ssr: false, loading: () => <div className={css.editorLoading} aria-hidden="true" /> },
);

function isSafeUrl(url: string) {
  const value = url.trim();
  return /^(https?:|mailto:|tel:)/i.test(value)
    || /^(#|\/|\.\/|\.\.\/)/.test(value);
}

export function MarkdownField(props: Props) {
  const { theme } = useColorMode();
  const { locale } = useTmsLocale();
  const colorMode = theme === "dark" ? "dark" : "light";
  if (!props.onChange) {
    if (!props.value.trim()) {
      return <p className={css.empty}>{props.emptyLabel}</p>;
    }
    return <MDEditor.Markdown
      className={css.rendered}
      source={props.value}
      skipHtml
      urlTransform={(url) => isSafeUrl(url) ? url : ""}
      wrapperElement={{ "data-color-mode": colorMode }}
    />;
  }
  return <div className={css.field} data-color-mode={colorMode} role="group" aria-label={props.label}>
    <WysiwygMarkdownEditor
      markdown={props.value}
      label={props.label}
      locale={locale}
      compact={props.compact}
      autoFocus={props.autoFocus}
      validateUrl={isSafeUrl}
      onChange={props.onChange}
    />
  </div>;
}
