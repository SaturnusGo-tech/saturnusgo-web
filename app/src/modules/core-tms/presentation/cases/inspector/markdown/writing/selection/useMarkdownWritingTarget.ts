import { activeEditor$, inFocus$, insertMarkdown$, useRealm } from "@mdxeditor/editor";
import { useCallback } from "react";
import type { WritingTarget } from "../../../../../../writing-assistant/model/target";
import { captureMarkdownTarget } from "./captureMarkdownTarget";
import { markdownExportParameters } from "./serialization/markdownSerialization";
import { canImportMarkdown, insertInlineMarkdown } from "./serialization/validateMarkdown";

export function useMarkdownWritingTarget(): () => WritingTarget | null {
  const realm = useRealm();
  return useCallback(() => {
    const editor = realm.getValue(activeEditor$);
    const parameters = markdownExportParameters(realm);
    if (!editor || !parameters) return null;
    return captureMarkdownTarget(editor, parameters, (markdown) => {
      // A toolbar/popover can change focus while the request is running; keep the captured owner.
      realm.pub(activeEditor$, editor);
      realm.pub(inFocus$, true);
      realm.pub(insertMarkdown$, markdown);
    }, (markdown) => canImportMarkdown(realm, editor, markdown), (markdown) => insertInlineMarkdown(realm, markdown));
  }, [realm]);
}
