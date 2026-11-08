import type { MDXEditorMethods } from "@mdxeditor/editor";
import { useCallback, useRef, type RefObject } from "react";
import { readProductDocImport } from "../sections/productDocMarkdown";

export function useProductDocMarkdownImport(editorRef: RefObject<MDXEditorMethods | null>, mounted: RefObject<boolean>,
  busy: boolean, onImport: () => void, onError: () => void) {
  const importInput = useRef<HTMLInputElement>(null);
  const readingFile = useRef(false);
  const chooseFile = useCallback(() => importInput.current?.click(), []);

  async function importText(file?: File) {
    if (!file || busy || readingFile.current || !editorRef.current) return;
    readingFile.current = true;
    try {
      const content = await readProductDocImport(file);
      if (!mounted.current) return;
      editorRef.current?.focus(() => editorRef.current?.insertMarkdown(content),
        { defaultSelection: "rootEnd", preventScroll: true });
      onImport();
    } catch {
      if (mounted.current) onError();
    } finally {
      readingFile.current = false;
    }
  }

  return { importInput, readingFile, chooseFile, importText };
}
