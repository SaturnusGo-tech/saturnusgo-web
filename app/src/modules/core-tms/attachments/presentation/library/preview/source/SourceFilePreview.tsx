"use client";

import { LanguageDescription, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { classHighlighter } from "@lezer/highlight";
import { useEffect, useRef } from "react";
import { isJsonFile } from "../model/file-preview-format";
import styles from "../attachment-file-preview.module.css";

export default function SourceFilePreview({ text, filename, mimeType, limited, ru }: {
  text: string; filename: string; mimeType?: string; limited: boolean; ru: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const label = ru ? "Содержимое файла" : "File contents";

  useEffect(() => {
    if (!container.current) return;
    const language = new Compartment();
    const view = new EditorView({
      parent: container.current,
      state: EditorState.create({
        doc: text,
        extensions: [
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          EditorView.contentAttributes.of({ tabindex: "0", "aria-label": label, "aria-readonly": "true" }),
          lineNumbers(),
          syntaxHighlighting(classHighlighter),
          language.of([]),
        ],
      }),
    });
    const basename = filename.split("/").pop() ?? filename;
    const languageFilename = isJsonFile(basename, mimeType) || /\.(jsonl|ndjson)$/i.test(basename) ? "file.json" : basename;
    const description = LanguageDescription.matchFilename(languages, languageFilename);
    let disposed = false;
    void description?.load().then(support => {
      if (!disposed) view.dispatch({ effects: language.reconfigure(support.extension) });
    }, () => undefined);
    return () => { disposed = true; view.destroy(); };
  }, [filename, label, mimeType, text]);

  return <div className={styles.sourcePreview}>
    <div className={styles.sourceEditor} ref={container} />
    {limited && <p className={styles.sourceLimit}>{ru ? "Показано начало файла" : "Showing the beginning of the file"}</p>}
  </div>;
}
