"use client";
import { useDocumentationCopy } from "../../localization/useDocumentationCopy";
import { useDocumentationCatalog } from "../../access/useDocumentationCatalog";
import type { DocBlock } from "../../model/article";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import { CopyButton } from "../controls/CopyButton";
import { ArticleWalkthrough } from "../walkthrough/ArticleWalkthrough";
import { DocumentationBlocks } from "./blocks/DocumentationBlocks";
export { DocumentationBlocks } from "./blocks/DocumentationBlocks";
type Navigation = Pick<ReturnType<typeof useDocumentationNavigation>, "link" | "navigate">;

export function ArticleBlocks({ blocks, navigation }: { blocks: DocBlock[]; navigation: Navigation }) {
  const copy = useDocumentationCopy();
  const { articleById } = useDocumentationCatalog();
  return <DocumentationBlocks blocks={blocks} navigation={navigation} articleById={articleById}
    renderWalkthrough={block => <ArticleWalkthrough block={block} />}
    renderCopy={value => <CopyButton value={value} label={copy.copyExample} />} />;
}
