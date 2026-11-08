import { addComposerChild$, realmPlugin, rootEditor$, useCellValue } from "@mdxeditor/editor";
import { $createLinkNode, $isLinkNode } from "@lexical/link";
import { $addUpdateTag, $createTextNode, $getNodeByKey, $getSelection, $isRangeSelection, $isTextNode, COMMAND_PRIORITY_HIGH, PASTE_COMMAND, SKIP_DOM_SELECTION_TAG } from "lexical";
import { useEffect } from "react";
import { useProductDocsWorkspace } from "../../../composition/context/ProductDocsContext";
import { readScopedProductDocLink } from "../../../navigation/product-doc-link";
import { productDocLinkMetadata } from "../description-link-metadata";
import styles from "../description-link.module.css";

function ProductDocDescriptionPaste() {
  const editor = useCellValue(rootEditor$);
  const docs = useProductDocsWorkspace();
  const api = docs?.api;
  const scope = docs?.scope;
  useEffect(() => {
    if (!editor || !api || !scope) return;
    const pending = new AbortController();
    const unregister = editor.registerCommand(PASTE_COMMAND, event => {
      if (!("clipboardData" in event) || !event.clipboardData || event.clipboardData.files.length) return false;
      const href = event.clipboardData.getData("text/plain").trim();
      if (!href || /\s/.test(href)) return false;
      const target = readScopedProductDocLink(href, window.location.href, scope);
      const range = $getSelection();
      if (!target || !$isRangeSelection(range)) return false;
      const url = new URL(href, window.location.href).href;
      const link = $createLinkNode(url);
      link.append($createTextNode(href));
      const key = link.getKey();
      event.preventDefault();
      range.insertNodes([link]);
      void api.get(scope, target.docId, {version: target.version, signal: pending.signal}).then(document => {
        if (pending.signal.aborted) return;
        const metadata = productDocLinkMetadata(document, target);
        if (!metadata) return;
        editor.update(() => {
          const node = $getNodeByKey(key);
          if (!$isLinkNode(node) || node.getURL() !== url || node.getTextContent() !== href) return;
          const text = node.getFirstChild();
          if (!$isTextNode(text) || node.getChildrenSize() !== 1) return;
          const selection = $getSelection();
          let moved = false;
          if ($isRangeSelection(selection)) for (const point of [selection.anchor, selection.focus]) {
            if (point.key !== text.getKey() || point.type !== "text") continue;
            const offset = point.offset === href.length ? metadata.label.length : Math.min(point.offset, metadata.label.length);
            if (point.offset !== offset) { point.set(text.getKey(), offset, "text"); moved = true; }
          }
          if (!moved) $addUpdateTag(SKIP_DOM_SELECTION_TAG);
          text.setTextContent(metadata.label);
          node.setTitle(metadata.label);
        }, {onUpdate: () => {
          const anchor = editor.getElementByKey(key);
          if (anchor?.getAttribute("title") === metadata.label) anchor.classList.add(styles.editorLink);
        }});
      }, () => {});
      return true;
    }, COMMAND_PRIORITY_HIGH);
    return () => { pending.abort(); unregister(); };
  }, [editor, api, scope]);
  return null;
}

export const productDocDescriptionPaste = realmPlugin({
  init(realm) { realm.pub(addComposerChild$, ProductDocDescriptionPaste); },
});
