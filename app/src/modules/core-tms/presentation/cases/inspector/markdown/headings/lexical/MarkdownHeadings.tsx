import { convertSelectionToNode$, currentBlockType$, useCellValue, usePublisher } from "@mdxeditor/editor";
import { $createHeadingNode } from "@lexical/rich-text";
import { $createParagraphNode } from "lexical";
import { HeadingButtons } from "../HeadingButtons";

export function MarkdownHeadings({ ru }: { ru: boolean }) {
  const current = useCellValue(currentBlockType$);
  const convert = usePublisher(convertSelectionToNode$);
  return <HeadingButtons ru={ru} current={current} onChoose={(heading) => {
    convert(() => current === heading ? $createParagraphNode() : $createHeadingNode(heading));
  }} />;
}
