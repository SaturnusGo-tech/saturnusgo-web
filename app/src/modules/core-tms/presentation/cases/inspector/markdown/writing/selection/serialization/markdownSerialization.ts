import * as MarkdownEditor from "@mdxeditor/editor";
import type { ExportMarkdownFromLexicalOptions, NodeRef, Realm } from "@mdxeditor/editor";
import { $getRoot, type LexicalEditor } from "lexical";
import { toMarkdown } from "mdast-util-to-markdown";

export type MarkdownExportParameters = Omit<ExportMarkdownFromLexicalOptions, "root">;

/** MDXEditor 4.2.3 exports these cells at runtime but omits them from its declaration rollup. */
export function markdownExportParameters(realm: Realm): MarkdownExportParameters | null {
  const runtime: typeof MarkdownEditor & Partial<{
    toMarkdownExtensions$: NodeRef<MarkdownExportParameters["toMarkdownExtensions"]>;
    toMarkdownOptions$: NodeRef<MarkdownExportParameters["toMarkdownOptions"]>;
  }> = MarkdownEditor;
  if (typeof runtime.toMarkdownExtensions$ !== "symbol" || typeof runtime.toMarkdownOptions$ !== "symbol") return null;
  return {
    visitors: realm.getValue(MarkdownEditor.exportVisitors$),
    jsxComponentDescriptors: realm.getValue(MarkdownEditor.jsxComponentDescriptors$),
    jsxIsAvailable: realm.getValue(MarkdownEditor.jsxIsAvailable$),
    toMarkdownExtensions: realm.getValue(runtime.toMarkdownExtensions$),
    toMarkdownOptions: realm.getValue(runtime.toMarkdownOptions$) ?? {},
  };
}

export function fullMarkdown(editor: LexicalEditor, parameters: MarkdownExportParameters) {
  return editor.getEditorState().read(() => toMarkdown(MarkdownEditor.exportLexicalTreeToMdast({
    root: $getRoot(), ...parameters,
  }), { extensions: parameters.toMarkdownExtensions, ...parameters.toMarkdownOptions }).replace(/\n+$/u, ""), { editor });
}
