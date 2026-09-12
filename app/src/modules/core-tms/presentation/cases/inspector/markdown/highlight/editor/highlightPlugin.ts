import {
  addExportVisitor$, addImportVisitor$, addMdastExtension$, addSyntaxExtension$,
  addToMarkdownExtension$, realmPlugin,
} from "@mdxeditor/editor";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import { directive } from "micromark-extension-directive";
import { highlightCodeImportVisitor, highlightExportVisitor, highlightImportVisitor } from "./highlightVisitors";

export const highlightPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addSyntaxExtension$]: directive(),
      [addMdastExtension$]: directiveFromMarkdown(),
      [addToMarkdownExtension$]: directiveToMarkdown(),
      [addImportVisitor$]: [highlightImportVisitor, highlightCodeImportVisitor],
      [addExportVisitor$]: highlightExportVisitor,
    });
  },
});
