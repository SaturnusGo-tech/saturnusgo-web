import { activeEditor$, useCellValue } from "@mdxeditor/editor";
import { $patchStyleText } from "@lexical/selection";
import { $getSelection, $isRangeSelection } from "lexical";
import { highlightStyleProperty } from "../../../../presentation/cases/inspector/markdown/highlight/model/highlightColors";
import { useProductDocToolbarSelection } from "../toolbar/menu/useProductDocToolbarSelection";
import { ProductDocHighlightPicker } from "./ProductDocHighlightPicker";

export function ProductDocBodyHighlight({ locale }: { locale: "ru" | "en" }) {
  const editor = useCellValue(activeEditor$);
  const { remember, restore, focusEditor } = useProductDocToolbarSelection();
  return <ProductDocHighlightPicker locale={locale} onOpen={remember} onChoose={(color) => {
    restore();
    editor?.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $patchStyleText(selection, { [highlightStyleProperty]: color });
      const end = selection.isBackward() ? selection.anchor : selection.focus;
      selection.anchor.set(end.key, end.offset, end.type);
      selection.focus.set(end.key, end.offset, end.type);
    }, { discrete: true });
    focusEditor();
  }} />;
}
