import * as MarkdownEditor from "@mdxeditor/editor";
import type { MdastTreeImportOptions, NodeRef, Realm } from "@mdxeditor/editor";
import { $getRoot, $insertNodes, $isParagraphNode, createEditor, type LexicalEditor, type LexicalNode } from "lexical";
import type { Options } from "mdast-util-from-markdown";
import { insertPartialBlocks } from "../blocks/insertPartialBlocks";

type ImportParameters = Omit<MdastTreeImportOptions, "mdastRoot"> & {
  markdown: string;
  mdastExtensions: Options["mdastExtensions"];
  syntaxExtensions: Options["extensions"];
};

/** The built-in insert signal catches parser errors; validate off-document before it can replace a range. */
export function canImportMarkdown(realm: Realm, editor: LexicalEditor, markdown: string): boolean {
  const importInto = markdownImporter(realm);
  if (!importInto) return false;
  // Creation in the owner's read context inherits registered nodes, including table/directive plugins.
  const temporary = editor.getEditorState().read(() => createEditor(), { editor });
  let valid = false;
  try {
    temporary.update(() => {
      try { importInto($getRoot(), markdown); valid = true; } catch { valid = false; }
    }, { discrete: true, skipTransforms: true });
  } catch { return false; }
  return valid;
}

/** Keep inline replies inside their source block; preserve explicit block replies as blocks. */
export function insertPartialMarkdown(realm: Realm, markdown: string): boolean {
  const importInto = markdownImporter(realm);
  if (!importInto) return false;
  const nodes: LexicalNode[] = [];
  importInto({ append: (node) => { nodes.push(node); }, getType: () => "root" }, markdown);
  // MDXEditor appends a caret paragraph after terminal blocks; it is not part of the response.
  while (nodes.length > 1) {
    const last = nodes[nodes.length - 1];
    if (!$isParagraphNode(last) || !last.isEmpty()) break;
    nodes.pop();
  }
  if (nodes.length !== 1 || !$isParagraphNode(nodes[0])) return insertPartialBlocks(nodes);
  $insertNodes(nodes[0].getChildren());
  return true;
}

function markdownImporter(realm: Realm) {
  const runtime: typeof MarkdownEditor & Partial<{
    importMarkdownToLexical: (parameters: ImportParameters) => void;
    mdastExtensions$: NodeRef<Options["mdastExtensions"]>;
  }> = MarkdownEditor;
  if (typeof runtime.importMarkdownToLexical !== "function" || typeof runtime.mdastExtensions$ !== "symbol") return null;
  const importer = runtime.importMarkdownToLexical;
  const mdastExtensions = realm.getValue(runtime.mdastExtensions$);
  return (root: MdastTreeImportOptions["root"], markdown: string) => {
        importer({ root, markdown, mdastExtensions,
          visitors: [...realm.getValue(MarkdownEditor.importVisitors$)],
          syntaxExtensions: realm.getValue(MarkdownEditor.syntaxExtensions$),
          jsxComponentDescriptors: realm.getValue(MarkdownEditor.jsxComponentDescriptors$),
          jsxKindMismatchPolicy: realm.getValue(MarkdownEditor.jsxKindMismatchPolicy$),
          directiveDescriptors: realm.getValue(MarkdownEditor.directiveDescriptors$),
          codeBlockEditorDescriptors: realm.getValue(MarkdownEditor.codeBlockEditorDescriptors$),
          defaultCodeBlockLanguage: realm.getValue(MarkdownEditor.defaultCodeBlockLanguage$),
        });
  };
}
