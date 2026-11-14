"use client";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { Compartment, EditorState, Transaction } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { useEffect, useRef } from "react";
import css from "./query-editor.module.css";

export function SqlQueryEditor({ value, onChange, onRun, label, disabled = false }: { value: string; onChange(value: string): void; onRun(): void; label: string; disabled?: boolean }) {
  const host = useRef<HTMLDivElement>(null), editor = useRef<EditorView | null>(null), source = useRef({ value, onChange, onRun, disabled });
  const access = useRef(new Compartment()).current;
  source.current = { value, onChange, onRun, disabled };
  useEffect(() => {
    if (!host.current) return;
    const language = new Compartment(), view = new EditorView({ parent: host.current, state: EditorState.create({ doc: source.current.value, extensions: [
      history(), lineNumbers(), language.of([]), access.of([]),
      keymap.of([{ key: "Mod-Enter", run: () => { if (!source.current.disabled) source.current.onRun(); return true; } }, ...defaultKeymap, ...historyKeymap]),
      syntaxHighlighting(HighlightStyle.define([
        { tag: [tags.keyword, tags.bool, tags.null], color: "light-dark(#b51963, #ff4f9a)" },
        { tag: tags.string, color: "var(--falcon-success)" },
        { tag: tags.number, color: "var(--falcon-discovery)" },
        { tag: tags.typeName, color: "var(--falcon-info)" },
        { tag: tags.operator, color: "var(--falcon-text-secondary)" },
        { tag: tags.comment, color: "var(--falcon-text-muted)", fontStyle: "italic" },
      ])),
      EditorView.updateListener.of(update => { if (update.docChanged && update.state.doc.toString() !== source.current.value) source.current.onChange(update.state.doc.toString()); }),
      EditorView.domEventHandlers({ keydown: event => { event.stopPropagation(); return false; } }),
    ] }) });
    editor.current = view; let disposed = false;
    void languages.find(item => item.name === "SQL")?.load().then(support => { if (!disposed) view.dispatch({ effects: language.reconfigure(support.extension) }); }).catch(() => { /* Plain SQL remains editable when language loading fails. */ });
    return () => { disposed = true; view.destroy(); editor.current = null; };
  }, [access]);
  useEffect(() => {
    const view = editor.current;
    if (view && value !== view.state.doc.toString()) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value }, annotations: Transaction.addToHistory.of(false) });
  }, [value]);
  useEffect(() => { editor.current?.dispatch({ effects: access.reconfigure([EditorState.readOnly.of(disabled), EditorView.editable.of(!disabled),
    EditorView.contentAttributes.of({ "aria-label": label, spellcheck: "false" })]) }); }, [access, disabled, label]);
  return <div className={css.editor} ref={host} />;
}
