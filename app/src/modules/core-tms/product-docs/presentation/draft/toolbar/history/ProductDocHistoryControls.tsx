import { mergeRegister } from "@lexical/utils";
import { activeEditor$, readOnly$, useCellValue } from "@mdxeditor/editor";
import { CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_CRITICAL, REDO_COMMAND, UNDO_COMMAND } from "lexical";
import { Redo2, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductDocToolbarButton } from "../menu/ProductDocToolbarMenu";

export function ProductDocHistoryControls({ ru }: { ru: boolean }) {
  const editor = useCellValue(activeEditor$);
  const readOnly = useCellValue(readOnly$);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!editor) return;
    return mergeRegister(
      editor.registerCommand(CAN_UNDO_COMMAND, (value) => { setCanUndo(value); return false; }, COMMAND_PRIORITY_CRITICAL),
      editor.registerCommand(CAN_REDO_COMMAND, (value) => { setCanRedo(value); return false; }, COMMAND_PRIORITY_CRITICAL),
    );
  }, [editor]);

  return <>
    <ProductDocToolbarButton isIconOnly label={ru ? "Отменить" : "Undo"} isDisabled={readOnly || !canUndo}
      onMouseDown={(event) => event.preventDefault()} onPress={() => editor?.dispatchCommand(UNDO_COMMAND, undefined)}>
      <Undo2 size={16} aria-hidden="true" />
    </ProductDocToolbarButton>
    <ProductDocToolbarButton isIconOnly label={ru ? "Повторить" : "Redo"} isDisabled={readOnly || !canRedo}
      onMouseDown={(event) => event.preventDefault()} onPress={() => editor?.dispatchCommand(REDO_COMMAND, undefined)}>
      <Redo2 size={16} aria-hidden="true" />
    </ProductDocToolbarButton>
  </>;
}
