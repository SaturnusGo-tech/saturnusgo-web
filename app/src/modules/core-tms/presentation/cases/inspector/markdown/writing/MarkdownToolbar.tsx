import { BoldItalicUnderlineToggles, CodeToggle, CreateLink, ListsToggle, Separator, StrikeThroughSupSubToggles, UndoRedo } from "@mdxeditor/editor";
import { WritingAction } from "../../../../../writing-assistant/presentation/WritingAction";
import { HighlightToolbar } from "../highlight/toolbar/HighlightToolbar";
import { useMarkdownWritingTarget } from "./selection/useMarkdownWritingTarget";

export function MarkdownToolbar({ locale }: { locale: "ru" | "en" }) {
  const capture = useMarkdownWritingTarget();
  return <>
    <WritingAction ru={locale === "ru"} capture={capture} /><Separator />
    <UndoRedo /><Separator />
    <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
    <StrikeThroughSupSubToggles options={["Strikethrough"]} />
    <HighlightToolbar locale={locale} /><CodeToggle /><Separator />
    <ListsToggle /><CreateLink />
  </>;
}
