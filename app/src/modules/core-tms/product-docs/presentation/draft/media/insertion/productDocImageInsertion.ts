import { $createDirectiveNode, $createImageNode } from "@mdxeditor/editor";
import { $insertNodeToNearestRoot, $wrapNodeInElement } from "@lexical/utils";
import { $createParagraphNode, $createRangeSelection, $getNodeByKey, $getRoot, $getSelection, $insertNodes,
  $isElementNode, $isRangeSelection, $isRootOrShadowRoot, $isTextNode, $setSelection,
  HISTORY_PUSH_TAG, type LexicalEditor, type RangeSelection } from "lexical";

import { productDocAttachmentName } from "../../../../domain/attachments/productDocAttachment";

export type ProductDocImageTarget = { editor: LexicalEditor; selection: RangeSelection | null };

export function captureImageTarget(editor: LexicalEditor, fallback?: RangeSelection | null, range?: Range | null): ProductDocImageTarget {
  const selection = editor.read("latest", () => {
    if (range) {
      const drop = $createRangeSelection();
      drop.applyDOMRange(range);
      return drop;
    }
    const current = $getSelection();
    return $isRangeSelection(current) ? current.clone() : fallback?.clone() ?? null;
  });
  return { editor, selection };
}

function $restoreMediaSelection(selection: RangeSelection | null, preserveText: boolean) {
  if (selection && [selection.anchor, selection.focus].every((point) => {
      const node = $getNodeByKey(point.key);
      return point.type === "text"
        ? $isTextNode(node) && point.offset <= node.getTextContentSize()
        : $isElementNode(node) && point.offset <= node.getChildrenSize();
    })) {
    const position = selection.clone();
    if (preserveText) position.focus.set(position.anchor.key, position.anchor.offset, position.anchor.type);
    $setSelection(position);
  } else if (!$isRangeSelection($getSelection())) {
    $getRoot().selectEnd();
  }
}

export function insertProductDocAttachments({ editor, selection }: ProductDocImageTarget, attachments: string[]) {
  if (!editor.isEditable() || !editor.getRootElement() || !attachments.length) return;
  editor.update(() => {
    $restoreMediaSelection(selection, true);
    const position = $getSelection();
    if ($isRangeSelection(position)) position.anchor.getNode().getTopLevelElement()?.selectEnd();
    for (const attachment of attachments) {
      $insertNodeToNearestRoot($createDirectiveNode({
        type: "leafDirective", name: productDocAttachmentName, attributes: { attachment }, children: [],
      }));
    }
  }, { tag: HISTORY_PUSH_TAG, discrete: true });
}

export function insertProductDocImages({ editor, selection }: ProductDocImageTarget, sources: string[]) {
  if (!editor.isEditable() || !sources.length) return;
  editor.update(() => {
    $restoreMediaSelection(selection, false);
    const images = sources.map((src) => $createImageNode({ src, altText: "" }));
    if (images.length === 1) {
      const [image] = images;
      $insertNodes([image]);
      if ($isRootOrShadowRoot(image.getParentOrThrow())) {
        $wrapNodeInElement(image, $createParagraphNode).selectEnd();
      }
    } else {
      $insertNodes(images.map((image) => $createParagraphNode().append(image)));
    }
  }, { tag: HISTORY_PUSH_TAG, discrete: true });
}
