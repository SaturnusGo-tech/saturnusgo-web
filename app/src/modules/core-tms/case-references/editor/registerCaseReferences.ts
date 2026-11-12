import { $createLinkNode, $isLinkNode } from "@lexical/link";
import { $addUpdateTag, $createTextNode, $getNodeByKey, $getRoot, $getSelection, $isRangeSelection, $isTextNode,
  HISTORY_MERGE_TAG, SKIP_DOM_SELECTION_TAG, TextNode, type LexicalEditor, type LexicalNode } from "lexical";
import type { CaseReferenceResolver } from "../application/caseReferenceResolver";
import { caseReferenceHref, findCaseKeys, type CaseKeyMatch, type CaseReference, type CaseReferenceScope } from "../domain/caseReference";

function isProse(node: LexicalNode): boolean {
  for (let parent = node.getParent(); parent; parent = parent.getParent()) {
    if ($isLinkNode(parent) || ["code", "code-highlight"].includes(parent.getType())) return false;
  }
  return true;
}

/** Do not rewrite an incomplete key beneath the caret while its digits are still being typed. */
function waitingForDelimiter(node: TextNode, match: CaseKeyMatch) {
  const selection = $getSelection();
  return match.end === node.getTextContentSize() && $isRangeSelection(selection) && selection.isCollapsed()
    && selection.anchor.key === node.getKey() && selection.anchor.offset === match.end;
}

export function registerCaseReferences(editor: LexicalEditor, context: {
  scope: CaseReferenceScope; resolver: Pick<CaseReferenceResolver, "resolve">;
}, origin: string) {
  let active = true;
  const pending = new Set<string>();
  function enhance(node: TextNode) {
    if (!node.isSimpleText() || node.hasFormat("code") || !isProse(node)) return;
    const text = node.getTextContent();
    const matches = findCaseKeys(text).filter(match => !waitingForDelimiter(node, match));
    const nodeKey = node.getKey();
    const signature = `${nodeKey}\0${text}`;
    if (!matches.length || pending.has(signature)) return;
    pending.add(signature);
    void Promise.all(matches.map(async match => ({ match, reference: await context.resolver.resolve(match.key) })))
      .then(results => {
        if (!active || !results.some(result => result.reference)) return;
        editor.update(() => {
          const current = $getNodeByKey(nodeKey);
          if (!$isTextNode(current) || !current.isSimpleText() || current.hasFormat("code")
            || current.getTextContent() !== text || !isProse(current)) return;
          const available = results.filter((result): result is { match: CaseKeyMatch; reference: CaseReference } =>
            Boolean(result.reference) && !waitingForDelimiter(current, result.match));
          if (!available.length) return;
          const selection = $getSelection();
          const hadCaret = $isRangeSelection(selection) && [selection.anchor, selection.focus].some(point => point.key === nodeKey);
          if (!hadCaret) $addUpdateTag(SKIP_DOM_SELECTION_TAG);
          // Right-to-left splitting preserves the original node for every earlier match.
          for (const { match, reference } of available.reverse()) {
            const parts = current.splitText(match.start, match.end);
            const segment = parts[match.start === 0 ? 0 : 1];
            const link = $createLinkNode(caseReferenceHref(reference, context.scope, origin));
            link.setTitle(reference.title);
            const label = $createTextNode(reference.title).setFormat(segment.getFormat()).setStyle(segment.getStyle());
            link.append(label);
            segment.replace(link);
            if ($isRangeSelection(selection)) for (const point of [selection.anchor, selection.focus]) {
              if (point.type === "text" && point.key === segment.getKey()) {
                point.set(label.getKey(), Math.min(point.offset, reference.title.length), "text");
              }
            }
          }
        }, { tag: HISTORY_MERGE_TAG });
      }).finally(() => pending.delete(signature));
  }
  const unregister = editor.registerNodeTransform(TextNode, enhance);
  editor.getEditorState().read(() => $getRoot().getAllTextNodes().forEach(enhance));
  return () => { active = false; pending.clear(); unregister(); };
}
