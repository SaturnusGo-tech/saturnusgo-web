import {
  addExportVisitor$, addImportVisitor$, addLexicalNode$, createRootEditorSubscription$, realmPlugin,
  type LexicalExportVisitor, type MdastImportVisitor,
} from "@mdxeditor/editor";
import {
  $copyNode, $createParagraphNode, $getRoot, $isElementNode, $isParagraphNode, $isRootNode,
  type LexicalEditor, type LexicalNode,
} from "lexical";
import type { ContainerDirective } from "mdast-util-directive";
import {
  isProductDocColumnCount, layoutBlockName, layoutColumnName, normalizeProductDocLayoutRatio,
  productDocColumnCount, productDocLayoutRatio, type ColumnCount,
} from "./productDocLayoutBlocks";
import {
  $createProductDocColumnNode, $createProductDocLayoutNode, ProductDocColumnNode, ProductDocLayoutNode,
} from "./nodes/productDocLayoutNodes";

export function $findProductDocLayout(node: LexicalNode | null): ProductDocLayoutNode | null {
  for (let parent = node; parent; parent = parent.getParent()) {
    if (parent instanceof ProductDocLayoutNode) return parent;
  }
  return null;
}

export function $insertProductDocLayout(count: ColumnCount, anchor: LexicalNode | null) {
  const root = $getRoot();
  const layout = $createProductDocLayoutNode();
  for (let index = 0; index < count; index += 1) {
    layout.append($createProductDocColumnNode().append($createParagraphNode()));
  }

  let block = anchor;
  while (block && !$isRootNode(block) && !$isRootNode(block.getParent())) block = block.getParent();
  if ($isParagraphNode(block) && block.isEmpty()) block.replace(layout);
  else if (block && !$isRootNode(block)) block.insertAfter(layout);
  else root.append(layout);

  if (!layout.getNextSibling()) layout.insertAfter($createParagraphNode());
  layout.getFirstChild<ProductDocColumnNode>()?.selectStart();
}

export function $removeProductDocLayout(layout: ProductDocLayoutNode) {
  const first = layout.getFirstChild<ProductDocColumnNode>()?.getFirstChild();
  for (const column of layout.getChildren<ProductDocColumnNode>()) {
    for (const block of column.getChildren()) layout.insertBefore(block);
  }
  layout.remove();
  first?.selectStart();
}

export function $resizeProductDocLayout(layout: ProductDocLayoutNode, count: ColumnCount) {
  const columns = layout.getChildren<ProductDocColumnNode>();
  for (let index = columns.length; index < count; index += 1) {
    layout.append($createProductDocColumnNode().append($createParagraphNode()));
  }
  for (const column of columns.slice(count)) {
    columns[count - 1].append(...column.getChildren());
    column.remove();
  }
}

export function $duplicateProductDocLayout(layout: ProductDocLayoutNode) {
  function $copyBranch(node: LexicalNode) {
    const duplicate = $copyNode(node);
    if ($isElementNode(node) && $isElementNode(duplicate)) {
      duplicate.append(...node.getChildren().map($copyBranch));
    }
    return duplicate;
  }

  const duplicate = $copyBranch(layout);
  layout.insertAfter(duplicate);
  duplicate.selectStart();
}

const importLayout: MdastImportVisitor<ContainerDirective> = {
  priority: 115,
  testNode: (node) => node.type === "containerDirective" && node.name === layoutBlockName,
  visitNode({ mdastNode, mdastParent, lexicalParent, actions }) {
    if (mdastParent?.type !== "root" || !productDocColumnCount(mdastNode)) {
      actions.visitChildren(mdastNode, lexicalParent);
      return;
    }
    actions.addAndStepInto($createProductDocLayoutNode(productDocLayoutRatio(mdastNode)));
  },
};

const importColumn: MdastImportVisitor<ContainerDirective> = {
  priority: 115,
  testNode: (node) => node.type === "containerDirective" && node.name === layoutColumnName,
  visitNode({ mdastNode, lexicalParent, actions }) {
    if (!(lexicalParent instanceof ProductDocLayoutNode)) {
      actions.visitChildren(mdastNode, lexicalParent);
      return;
    }
    const column = $createProductDocColumnNode();
    actions.addAndStepInto(column);
    if (column.isEmpty()) column.append($createParagraphNode());
  },
};

const exportLayout: LexicalExportVisitor<ProductDocLayoutNode, ContainerDirective> = {
  testLexicalNode: (node) => node instanceof ProductDocLayoutNode,
  visitLexicalNode({ actions, lexicalNode }) {
    const ratio = lexicalNode.getRatio();
    actions.addAndStepInto("containerDirective", { name: layoutBlockName, attributes: ratio === "even" ? undefined : { ratio } });
  },
};

const exportColumn: LexicalExportVisitor<ProductDocColumnNode, ContainerDirective> = {
  testLexicalNode: (node) => node instanceof ProductDocColumnNode,
  visitLexicalNode({ actions }) {
    actions.addAndStepInto("containerDirective", { name: layoutColumnName });
  },
};

function registerLayoutTransforms(editor: LexicalEditor) {
  const unregisterLayout = editor.registerNodeTransform(ProductDocLayoutNode, (layout) => {
    if (!layout.getChildren().every((node) => node instanceof ProductDocColumnNode)) {
      for (const child of layout.getChildren()) {
        if (!(child instanceof ProductDocColumnNode)) layout.insertBefore(child);
      }
    }
    const columns = layout.getChildrenSize();
    if (!isProductDocColumnCount(columns) || !$isRootNode(layout.getParent())) {
      $removeProductDocLayout(layout);
      return;
    }
    const ratio = normalizeProductDocLayoutRatio(layout.getRatio(), columns);
    if (ratio !== layout.getRatio()) layout.setRatio(ratio);
  });
  const unregisterColumn = editor.registerNodeTransform(ProductDocColumnNode, (column) => {
    const parent = column.getParent();
    if (!(parent instanceof ProductDocLayoutNode) && $isElementNode(parent)) {
      for (const child of column.getChildren()) column.insertBefore(child);
      column.remove();
    } else if (column.isEmpty()) {
      column.append($createParagraphNode());
    }
  });
  return () => { unregisterLayout(); unregisterColumn(); };
}

export const productDocLayoutsPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addLexicalNode$]: [ProductDocLayoutNode, ProductDocColumnNode],
      [addImportVisitor$]: [importLayout, importColumn],
      [addExportVisitor$]: [exportLayout, exportColumn],
      [createRootEditorSubscription$]: registerLayoutTransforms,
    });
  },
});
