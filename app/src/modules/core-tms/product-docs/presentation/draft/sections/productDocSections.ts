import { $createHeadingNode, $isHeadingNode, HeadingNode } from "@lexical/rich-text";
import {
  addExportVisitor$, addImportVisitor$, addLexicalNode$, createRootEditorSubscription$, realmPlugin,
  type LexicalExportVisitor, type MdastImportVisitor,
} from "@mdxeditor/editor";
import {
  $getRoot, $getState, $isRootNode, $setState, COMMAND_PRIORITY_HIGH,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND, type LexicalEditor, type LexicalNode,
} from "lexical";
import type { Heading, RootContent } from "mdast";
import type { LeafDirective } from "mdast-util-directive";
import { $createProductDocBoundaryNode, ProductDocBoundaryNode } from "./nodes/ProductDocBoundaryNode";
import { anchorDirective, readAnchor } from "./productDocMarkdown";
import { literalHeadingState, sectionIdState } from "./nodes/sectionNodeState";

export { editorMarkdownToSections, escapeProductDocImportAnchors, sectionsToEditorMarkdown } from "./productDocMarkdown";

const markerImport: MdastImportVisitor<LeafDirective> = {
  priority: 100,
  testNode: (node) => node.type === "leafDirective" && Boolean(readAnchor(node)),
  visitNode({ mdastNode, mdastParent, actions }) {
    const marker = readAnchor(mdastNode);
    if (!marker || mdastParent?.type !== "root") return actions.nextVisitor();
    if (marker.kind === "body") actions.addAndStepInto($createProductDocBoundaryNode(marker.id));
  },
};

const headingImport: MdastImportVisitor<Heading> = {
  priority: 100,
  testNode: "heading",
  visitNode({ mdastNode, mdastParent, actions }) {
    if (mdastParent?.type !== "root") return actions.nextVisitor();
    const index = mdastParent.children.indexOf(mdastNode);
    const previous = index > 0 ? mdastParent.children[index - 1] as RootContent : undefined;
    const marker = readAnchor(previous);
    if (!marker || marker.kind === "body") return actions.nextVisitor();
    const tag = `h${mdastNode.depth}` as ReturnType<HeadingNode["getTag"]>;
    const heading = $createHeadingNode(tag);
    if (marker.kind === "heading") $setState(heading, sectionIdState, marker.id);
    else $setState(heading, literalHeadingState, true);
    actions.addAndStepInto(heading);
  },
};

const headingExport: LexicalExportVisitor<HeadingNode, Heading | LeafDirective> = {
  priority: 100,
  testLexicalNode: $isHeadingNode,
  visitLexicalNode({ lexicalNode, mdastParent, actions }) {
    if (mdastParent.type === "root") {
      const id = $getState(lexicalNode, sectionIdState);
      if (id) actions.appendToParent(mdastParent, anchorDirective({ kind: "heading", id }));
      else if ($getState(lexicalNode, literalHeadingState)) {
        actions.appendToParent(mdastParent, anchorDirective({ kind: "literal" }));
      }
    }
    actions.nextVisitor();
  },
};

const bodyBoundaryExport: LexicalExportVisitor<ProductDocBoundaryNode, LeafDirective> = {
  priority: 100,
  testLexicalNode: (node: LexicalNode): node is ProductDocBoundaryNode => node instanceof ProductDocBoundaryNode,
  visitLexicalNode({ lexicalNode, mdastParent, actions }) {
    const id = $getState(lexicalNode, sectionIdState);
    if (id && mdastParent.type === "root") actions.appendToParent(mdastParent, anchorDirective({ kind: "body", id }));
  },
};

function assignSectionId(node: HeadingNode | ProductDocBoundaryNode) {
  if (!$isRootNode(node.getParent())) return;
  const id = $getState(node, sectionIdState);
  if (!id && $isHeadingNode(node)
    && ($getState(node, literalHeadingState) || !["h1", "h2"].includes(node.getTag()))) return;
  if (!id || node.getPreviousSiblings().some((sibling) => $getState(sibling, sectionIdState) === id)) {
    $setState(node, sectionIdState, crypto.randomUUID());
  }
}

function rekeyCopiedSections(nodes: readonly LexicalNode[]) {
  const usedIds = new Set($getRoot().getChildren().map((node) => $getState(node, sectionIdState)));
  for (const node of nodes) {
    const id = $getState(node, sectionIdState);
    if (!id) continue;
    if (usedIds.has(id)) $setState(node, sectionIdState, crypto.randomUUID());
    else usedIds.add(id);
  }
}

/** Pair with MDXEditor's directivesPlugin and headingsPlugin. */
export const productDocSectionsPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addLexicalNode$]: ProductDocBoundaryNode,
      [addImportVisitor$]: [markerImport, headingImport],
      [addExportVisitor$]: [headingExport, bodyBoundaryExport],
      [createRootEditorSubscription$]: (editor: LexicalEditor) => {
        const unregisterHeading = editor.registerNodeTransform(HeadingNode, assignSectionId);
        const unregisterBoundary = editor.registerNodeTransform(ProductDocBoundaryNode, assignSectionId);
        const unregisterPaste = editor.registerCommand(SELECTION_INSERT_CLIPBOARD_NODES_COMMAND, ({ nodes }) => {
          rekeyCopiedSections(nodes);
          return false;
        }, COMMAND_PRIORITY_HIGH);
        return () => { unregisterHeading(); unregisterBoundary(); unregisterPaste(); };
      },
    });
  },
});
