import { addComposerChild$, realmPlugin, rootEditor$, useCellValue } from "@mdxeditor/editor";
import { $createLinkNode, $isLinkNode } from "@lexical/link";
import { $addUpdateTag, $createTextNode, $getNodeByKey, $getSelection, $isRangeSelection, $isTextNode,
  COMMAND_PRIORITY_HIGH, HISTORY_MERGE_TAG, PASTE_COMMAND, SKIP_DOM_SELECTION_TAG } from "lexical";
import { useEffect } from "react";
import { useOptionalTmsHttpClient } from "../../../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { useProductDocsWorkspace } from "../../../../composition/context/ProductDocsContext";
import { resolveProductDocSmartLink } from "../../../../state/links/resolveProductDocSmartLink";
import { readProductDocSmartTarget } from "../../../../navigation/product-doc-smart-link";

function SmartPaste() {
  const editor = useCellValue(rootEditor$);
  const client = useOptionalTmsHttpClient();
  const scope = useProductDocsWorkspace()?.scope;
  const { locale } = useTmsLocale();
  useEffect(() => {
    if (!editor || !client || !scope) return;
    let mounted = true;
    const unregister = editor.registerCommand(PASTE_COMMAND, event => {
      if (!("clipboardData" in event) || !event.clipboardData || event.clipboardData.files.length) return false;
      const href = event.clipboardData.getData("text/plain").trim();
      if (!href || /\s/.test(href) || !/^(https?:\/\/|\/(?![\/\\]))/i.test(href)) return false;
      const selection = $getSelection();
      const target = readProductDocSmartTarget(href, window.location.href, scope);
      if (!target || !$isRangeSelection(selection)) return false;
      const url = new URL(href, window.location.href);
      const label = target.kind === "external" ? url.hostname : target.kind === "case"
        ? (locale === "ru" ? "Тест-кейс" : "Test case") : (locale === "ru" ? "Документация" : "Documentation");
      const link = $createLinkNode(url.href);
      link.append($createTextNode(label));
      const key = link.getKey();
      event.preventDefault();
      selection.insertNodes([link]);
      void resolveProductDocSmartLink(client, scope, target).then(preview => {
        const title = preview?.title;
        if (!mounted || !title || title === label) return;
        editor.update(() => {
          const node = $getNodeByKey(key);
          if (!$isLinkNode(node) || node.getURL() !== url.href || node.getChildrenSize() !== 1) return;
          const text = node.getFirstChild();
          if (!$isTextNode(text) || text.getTextContent() !== label) return;
          const range = $getSelection();
          let moved = false;
          if ($isRangeSelection(range)) for (const point of [range.anchor, range.focus]) {
            if (point.key !== text.getKey() || point.type !== "text") continue;
            point.set(text.getKey(), point.offset === label.length ? title.length : Math.min(point.offset, title.length), "text");
            moved = true;
          }
          if (!moved) $addUpdateTag(SKIP_DOM_SELECTION_TAG);
          text.setTextContent(title);
          node.setTitle(title);
        }, { tag: HISTORY_MERGE_TAG });
      });
      return true;
    }, COMMAND_PRIORITY_HIGH);
    return () => { mounted = false; unregister(); };
  }, [client, editor, locale, scope]);
  return null;
}

export const productDocSmartPaste = realmPlugin({
  init(realm) { realm.pub(addComposerChild$, SmartPaste); },
});
