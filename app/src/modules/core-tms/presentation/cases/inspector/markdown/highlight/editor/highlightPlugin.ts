import {
  addExportVisitor$, addImportVisitor$, addMdastExtension$, addSyntaxExtension$,
  addToMarkdownExtension$, realmPlugin,
} from "@mdxeditor/editor";
import { highlightFromMarkdown, highlightToMarkdown } from "../serialization/highlightSerialization";
import { directive } from "micromark-extension-directive";
import { highlightCodeImportVisitor, highlightExportVisitor, highlightImportVisitor } from "./highlightVisitors";

export const highlightPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addSyntaxExtension$]: directive(),
      [addMdastExtension$]: highlightFromMarkdown(),
      [addToMarkdownExtension$]: highlightToMarkdown(),
      [addImportVisitor$]: [highlightImportVisitor, highlightCodeImportVisitor],
      [addExportVisitor$]: highlightExportVisitor,
    });
  },
});
