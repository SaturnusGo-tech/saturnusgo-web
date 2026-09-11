"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useCodeBlockEditorContext, type CodeBlockEditorProps } from "@mdxeditor/editor";
import css from "./markdownCodeEditor.module.css";

export function MarkdownCodeEditor({ code, language, focusEmitter }: CodeBlockEditorProps) {
  const { setCode } = useCodeBlockEditorContext();
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { focusEmitter.subscribe(() => input.current?.focus()); }, [focusEmitter]);
  useLayoutEffect(() => {
    const element = input.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(240, element.scrollHeight)}px`;
  }, [code]);
  return <textarea ref={input} className={css.code} rows={1} value={code} spellCheck={false}
    aria-label={language ? `Code (${language})` : "Code"} onChange={(event) => setCode(event.target.value)} />;
}
