import * as MarkdownEditor from "@mdxeditor/editor";
import { Realm, activeEditor$, rootEditor$, inFocus$, usedLexicalNodes$, insertMarkdown$, setMarkdown$,
  headingsPlugin, listsPlugin, codeBlockPlugin, quotePlugin, linkPlugin, tablePlugin, type RealmPlugin } from "@mdxeditor/editor";
import { createEditor, $getRoot, $setSelection, $isElementNode, $isParagraphNode, type LexicalNode } from "lexical";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import { captureMarkdownTarget } from "../../captureMarkdownTarget";
import { markdownExportParameters, fullMarkdown } from "../../serialization/markdownSerialization";
import { canImportMarkdown, insertPartialMarkdown } from "../../serialization/validateMarkdown";

/** Actual configured MDXEditor import/export and insertion signals, without a DOM renderer. */
export function longWritingHarness() {
  const realm = new Realm();
  const { corePlugin } = MarkdownEditor as typeof MarkdownEditor & {
    corePlugin: (params: { suppressHtmlProcessing: boolean; onChange: () => void }) => RealmPlugin;
  };
  const plugins = [corePlugin({ suppressHtmlProcessing: true, onChange() {} }), headingsPlugin(), listsPlugin(), quotePlugin(), tablePlugin(),
    linkPlugin(), codeBlockPlugin({ codeBlockEditorDescriptors: [{ priority: 0, match: () => true, Editor: () => null }] })];
  plugins.forEach((plugin) => plugin.init?.(realm));
  const editor = createEditor({ nodes: realm.getValue(usedLexicalNodes$), onError: (error) => { throw error; } });
  editor._headless = true; editor.focus = () => {};
  editor.getRootElement = () => ({ isConnected: true, focus() {} }) as unknown as HTMLElement;
  const root = editor.getRootElement(); editor.getRootElement = () => root;
  realm.pub(rootEditor$, editor); realm.pub(activeEditor$, editor); realm.pub(inFocus$, true);
  registerHistory(editor, createEmptyHistoryState(), 300);
  const parameters = markdownExportParameters(realm)!;
  const capture = () => captureMarkdownTarget(editor, parameters, (markdown) => realm.pub(insertMarkdown$, markdown),
    (markdown) => canImportMarkdown(realm, editor, markdown), (markdown) => insertPartialMarkdown(realm, markdown));
  const importSaved = (markdown: string) => editor.update(() => realm.pub(setMarkdown$, markdown), { discrete: true });
  const wholeField = () => editor.update(() => { $setSelection(null); }, { discrete: true });
  const shape = () => editor.getEditorState().read(() => {
    const counts: Record<string, number> = {}; let emptyParagraphs = 0, totalNodes = 0;
    const walk = (node: LexicalNode) => {
      totalNodes++; counts[node.getType()] = (counts[node.getType()] ?? 0) + 1;
      if ($isParagraphNode(node) && node.isEmpty()) emptyParagraphs++;
      if ($isElementNode(node)) node.getChildren().forEach(walk);
    };
    walk($getRoot());
    return { counts, emptyParagraphs, totalNodes, text: $getRoot().getTextContent() };
  });
  return { editor, capture, importSaved, wholeField, shape, read: () => fullMarkdown(editor, parameters) };
}
