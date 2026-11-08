import { $createImageNode } from "@mdxeditor/editor";
import { $wrapNodeInElement } from "@lexical/utils";
import { $createParagraphNode, $createRangeSelection, $getNodeByKey, $getRoot, $getSelection, $insertNodes,
  $isElementNode, $isRangeSelection, $isRootOrShadowRoot, $isTextNode, $setSelection,
  HISTORY_PUSH_TAG, type LexicalEditor, type RangeSelection } from "lexical";

export type ProductDocImageTarget = { editor: LexicalEditor; selection: RangeSelection | null };

export function captureImageTarget(editor: LexicalEditor, fallback?: RangeSelection | null, range?: Range | null): ProductDocImageTarget {
  const selection = editor.getEditorState().read(() => {
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

export function insertProductDocImages({ editor, selection }: ProductDocImageTarget, sources: string[]) {
  if (!editor.isEditable() || !sources.length) return;
  editor.update(() => {
    if (selection && [selection.anchor, selection.focus].every((point) => {
      const node = $getNodeByKey(point.key);
      return point.type === "text"
        ? $isTextNode(node) && point.offset <= node.getTextContentSize()
        : $isElementNode(node) && point.offset <= node.getChildrenSize();
    })) {
      $setSelection(selection);
    } else if (!$isRangeSelection($getSelection())) {
      $getRoot().selectEnd();
    }
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
