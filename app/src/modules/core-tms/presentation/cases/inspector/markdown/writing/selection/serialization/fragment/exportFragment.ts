import { $generateJSONFromSelectedNodes, $generateNodesFromSerializedNodes } from "@lexical/clipboard";
import { $createParagraphNode, $getRoot, createEditor, type BaseSelection, type LexicalEditor } from "lexical";
import { fullMarkdown, type MarkdownExportParameters } from "../markdownSerialization";

/** Export the captured selection, including list structure and inline formatting, never a later caret. */
export function exportFragment(editor: LexicalEditor, selection: BaseSelection, parameters: MarkdownExportParameters) {
  const { temporary, serialized } = editor.getEditorState().read(() => ({
    temporary: createEditor(), serialized: $generateJSONFromSelectedNodes(editor, selection).nodes,
  }), { editor });
  let error: unknown;
  temporary.update(() => {
    try {
      const root = $getRoot();
      let inline = $createParagraphNode();
      const flush = () => { if (!inline.isEmpty()) { root.append(inline); inline = $createParagraphNode(); } };
      for (const node of $generateNodesFromSerializedNodes(serialized)) {
        if (node.isInline()) inline.append(node);
        else { flush(); root.append(node); }
      }
      flush();
    } catch (caught) { error = caught; }
  }, { discrete: true, skipTransforms: true });
  if (error) throw error;
  return fullMarkdown(temporary, parameters);
}
