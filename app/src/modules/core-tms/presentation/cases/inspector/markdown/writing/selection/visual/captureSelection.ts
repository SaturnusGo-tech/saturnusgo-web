import { createDOMRange } from "@lexical/selection";
import { $createRangeSelection, $getSelection, $isRangeSelection, type BaseSelection, type LexicalEditor } from "lexical";

/** Read browser endpoints before a toolbar, touch tap or popup can move focus. */
export function captureSelection(editor: LexicalEditor, root: HTMLElement) {
  return editor.getEditorState().read(() => {
    let selection = $getSelection()?.clone() ?? null;
    const native = root.ownerDocument?.getSelection();
    if (native?.rangeCount && native.getRangeAt(0).intersectsNode(root)) {
      if (!selection || $isRangeSelection(selection)) {
        const dom = native.getRangeAt(0).cloneRange();
        // A drag ending beyond the editor still targets only the selected part of this field.
        if (!root.contains(dom.startContainer)) dom.setStart(root, 0);
        if (!root.contains(dom.endContainer)) dom.setEnd(root, root.childNodes.length);
        const range = $createRangeSelection();
        range.applyDOMRange(dom);
        if (native.anchorNode === native.getRangeAt(0).endContainer && native.anchorOffset === native.getRangeAt(0).endOffset) {
          const anchor = { ...range.anchor }, focus = { ...range.focus };
          range.anchor.set(focus.key, focus.offset, focus.type);
          range.focus.set(anchor.key, anchor.offset, anchor.type);
        }
        selection = range;
      }
    }
    return selection;
  }, { editor });
}

export function selectionRanges(editor: LexicalEditor, root: HTMLElement, selection: BaseSelection | null, selected: boolean) {
  if (!root.ownerDocument) return [];
  return editor.getEditorState().read(() => {
    if (!selected) {
      const range = root.ownerDocument.createRange(); range.selectNodeContents(root);
      return [range];
    }
    if ($isRangeSelection(selection)) {
      const { anchor, focus } = selection;
      const range = createDOMRange(editor, anchor.getNode(), anchor.offset, focus.getNode(), focus.offset);
      return range ? [range] : [];
    }
    return (selection?.getNodes() ?? []).flatMap((node) => {
      const element = editor.getElementByKey(node.getKey());
      if (!element || !root.contains(element)) return [];
      const range = root.ownerDocument.createRange(); range.selectNodeContents(element);
      return [range];
    });
  }, { editor });
}
