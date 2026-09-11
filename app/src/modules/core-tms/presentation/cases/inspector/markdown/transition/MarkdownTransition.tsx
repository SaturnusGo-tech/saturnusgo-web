"use client";
import { useReducedMotion } from "framer-motion";
import { createContext, useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import css from "./markdownTransition.module.css";

export const MarkdownReadyContext = createContext<(() => void) | null>(null);

export function MarkdownTransition({ editing, read, editor, autoFocus }: { editing: boolean; read: ReactNode; editor: ReactNode; autoFocus?: boolean }) {
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(editing);
  const [height, setHeight] = useState<number>();
  const readRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);
  const lastEditor = useRef(editor);
  if (editing) lastEditor.current = editor;
  const reduced = useReducedMotion();
  const visible = editing && ready;
  const onReady = useCallback(() => { if (editing) setReady(true); }, [editing]);
  useLayoutEffect(() => {
    if (editing) { setMounted(true); return; }
    const timeout = window.setTimeout(() => { setMounted(false); setReady(false); }, reduced ? 0 : 220);
    return () => window.clearTimeout(timeout);
  }, [editing, reduced]);
  useLayoutEffect(() => {
    const node = visible ? editRef.current : readRef.current;
    if (!node) return;
    const measure = () => setHeight(node.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, read, editor]);
  useLayoutEffect(() => {
    if (readRef.current) readRef.current.inert = editing;
    if (editRef.current) editRef.current.inert = !visible;
    if (!visible || !autoFocus) return;
    const frame = requestAnimationFrame(() => editRef.current?.querySelector<HTMLElement>('[contenteditable="true"]')?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [editing, visible, mounted, autoFocus]);
  return <div className={css.frame} data-markdown-transition data-editing={editing}
    aria-busy={editing && !ready} style={{ height }}>
    <div ref={readRef} className={css.read} aria-hidden={editing}
      style={{ opacity: visible ? 0 : 1, pointerEvents: editing ? "none" : "auto" }}>
      {read}
    </div>
    {(mounted || editing) && <div ref={editRef} className={css.editor} aria-hidden={!visible}
      style={{ opacity: visible ? 1 : 0, transform: `translateY(${visible ? 0 : 3}px)`, pointerEvents: visible ? "auto" : "none" }}>
      <MarkdownReadyContext.Provider value={onReady}>{editing ? editor : lastEditor.current}</MarkdownReadyContext.Provider>
    </div>}
  </div>;
}
