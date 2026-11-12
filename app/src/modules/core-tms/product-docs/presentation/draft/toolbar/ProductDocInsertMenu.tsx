"use client";
import { AnchoredPopover as Popover } from "../../../../../../shared/components/anchored-popup/popover/AnchoredPopover";

import { Listbox, PopoverContent, PopoverTrigger } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { activeEditor$, currentSelection$, editorInTable$, readOnly$, useCellValue } from "@mdxeditor/editor";
import { $getNodeByKey, $getRoot, $getSelection, $isRangeSelection, $setSelection, type RangeSelection } from "lexical";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { productDocMacShortcuts } from "../commands/keyboard/commandShortcuts";
import { productDocCommandRows } from "../commands/menu/ProductDocCommandRows";
import { useProductDocInsertCommands, type ProductDocInsertCommand } from "../commands/registry/useProductDocInsertCommands";
import commandStyles from "../commands/menu/commands.module.css";
import { ProductDocToolbarButton } from "./menu/ProductDocToolbarMenu";

export function ProductDocInsertMenu({ locale, onImport }: { locale: TmsLocale; onImport(): void }) {
  const ru = locale === "ru";
  const editor = useCellValue(activeEditor$);
  const currentSelection = useCellValue(currentSelection$);
  const readOnly = useCellValue(readOnly$);
  const inTable = useCellValue(editorInTable$);
  const reduced = useReducedMotion();
  const saved = useRef<RangeSelection | null>(null);
  const [open, setOpen] = useState(false);
  const commands = useProductDocInsertCommands(locale, onImport).filter((command) => !inTable || command.inTable);

  function remember() {
    saved.current = editor?.getEditorState().read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) ? selection.clone() : currentSelection?.clone() ?? null;
    }) ?? null;
  }

  function changeOpen(next: boolean) {
    if (next && !saved.current) remember();
    if (!next) saved.current = null;
    setOpen(next);
  }

  function execute(command: ProductDocInsertCommand) {
    const selection = saved.current;
    changeOpen(false);
    if (editor && command.id !== "import") {
      editor.update(() => {
        if (selection && $getNodeByKey(selection.anchor.key) && $getNodeByKey(selection.focus.key)) {
          $setSelection(selection.clone());
        } else if (!$isRangeSelection($getSelection())) {
          $getRoot().selectEnd();
        }
      }, { discrete: true });
    }
    command.run();
  }

  const label = ru ? "Вставить" : "Insert";
  return <Popover isOpen={open && !readOnly} onOpenChange={changeOpen} placement="bottom-start" offset={6} containerPadding={10}
    shouldBlockScroll={false} shouldCloseOnScroll={false} disableAnimation={Boolean(reduced)}
    classNames={{ content: `${commandStyles.menu} ${commandStyles.toolbarMenu}` }} style={{ zIndex: 160 }}>
    <PopoverTrigger>
      <ProductDocToolbarButton label={label} isIconOnly isDisabled={readOnly} onPointerDownCapture={remember} onKeyDownCapture={(event) => {
        if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") remember();
      }}>
        <Plus size={17} aria-hidden="true" />
      </ProductDocToolbarButton>
    </PopoverTrigger>
    <PopoverContent aria-label={label} data-editor-dialog>
      <div className={commandStyles.viewport}>
        <Listbox autoFocus aria-label={label} classNames={{ base: commandStyles.listbox, list: commandStyles.options }}
          itemClasses={{ base: commandStyles.option, title: commandStyles.label }} onAction={(key) => {
            const command = commands.find((item) => item.id === key);
            if (command) execute(command);
          }}>
          {productDocCommandRows(commands, locale, productDocMacShortcuts())}
        </Listbox>
      </div>
    </PopoverContent>
  </Popover>;
}
