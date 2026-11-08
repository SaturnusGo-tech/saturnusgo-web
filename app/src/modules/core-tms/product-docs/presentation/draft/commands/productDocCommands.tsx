"use client";

import { Listbox, usePopover } from "@heroui/react";
import { LexicalTypeaheadMenuPlugin, MenuOption, type MenuRenderFn } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { addComposerChild$, editorInTable$, readOnly$, realmPlugin, rootEditor$, useCellValue } from "@mdxeditor/editor";
import { $getSelection, $isParagraphNode, $isRangeSelection, $isRootNode, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_NORMAL, KEY_DOWN_COMMAND } from "lexical";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { toolbarMenuMotion } from "../toolbar/menu/ProductDocToolbarMenu";
import { productDocCommandQuery } from "./commandQuery";
import { productDocMacShortcuts, productDocShortcutCommand } from "./keyboard/commandShortcuts";
import { productDocCommandRows } from "./menu/ProductDocCommandRows";
import { productDocCommandMatches, useProductDocInsertCommands, type ProductDocInsertCommand } from "./registry/useProductDocInsertCommands";
import styles from "./menu/commands.module.css";

class InsertOption extends MenuOption {
  constructor(readonly command: ProductDocInsertCommand) { super(command.id); }
}
type CommandMenu = Parameters<MenuRenderFn<InsertOption>>[1];

function InsertMenu({ anchor, menu, closing }: { anchor: RefObject<HTMLElement>; menu: CommandMenu; closing: boolean }) {
  const { locale } = useTmsLocale();
  const reduced = useReducedMotion();
  const viewport = useRef<HTMLDivElement>(null);
  const previous = useRef(menu);
  if (!closing && menu.options.length) previous.current = menu;
  const { options, selectedIndex, selectOptionAndCleanUp, setHighlightedIndex } = closing ? previous.current : menu;
  const label = locale === "ru" ? "Вставить" : "Insert";
  const mac = productDocMacShortcuts();
  const { getPopoverProps } = usePopover({
    isOpen: true, triggerRef: anchor, placement: "bottom-start", offset: 3, containerPadding: 12,
    isDismissable: false, shouldCloseOnBlur: false, shouldCloseOnScroll: false, shouldBlockScroll: false,
  });

  useLayoutEffect(() => {
    if (!viewport.current) return;
    const elements = viewport.current.querySelectorAll<HTMLElement>("[role=option]");
    options.forEach((option, index) => option.setRefElement(elements[index] ?? null));
    const selected = selectedIndex === null ? null : elements[selectedIndex];
    if (!selected) return;
    const optionBounds = selected.getBoundingClientRect();
    const menuBounds = viewport.current.getBoundingClientRect();
    const delta = optionBounds.top < menuBounds.top ? optionBounds.top - menuBounds.top
      : Math.max(0, optionBounds.bottom - menuBounds.bottom);
    viewport.current.scrollTop += delta;
  }, [options, selectedIndex]);

  return createPortal(<div {...getPopoverProps({ style: { zIndex: 160 } })} data-doc-slash-menu>
    <motion.div className={styles.menu} initial={reduced ? false : "initial"} animate={closing ? "exit" : "enter"}
      variants={toolbarMenuMotion} aria-hidden={closing || undefined} inert={closing || undefined}>
      <div ref={viewport} className={styles.viewport} onPointerMoveCapture={(event) => {
        if (!(event.target instanceof Element)) return;
        const item = event.target.closest<HTMLElement>("[data-doc-command-index]");
        const index = Number(item?.dataset.docCommandIndex ?? -1);
        if (index >= 0 && index !== selectedIndex) setHighlightedIndex(index);
      }}>
        <Listbox aria-label={label} hideEmptyContent selectionMode="none" shouldUseVirtualFocus
          classNames={{ base: styles.listbox, list: styles.options }} itemClasses={{ base: styles.option, title: styles.label }}
          onMouseDown={(event) => event.preventDefault()} onAction={(key) => {
            const option = options.find((entry) => entry.key === key);
            if (option) selectOptionAndCleanUp(option);
          }}>
          {productDocCommandRows(options.map(({ command }) => command), locale, mac, { selected: selectedIndex })}
        </Listbox>
      </div>
    </motion.div>
  </div>, document.body);
}

function ProductDocCommands() {
  const { locale } = useTmsLocale();
  const [query, setQuery] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const reduced = useReducedMotion();
  const pendingClose = useRef<Promise<void> | null>(null);
  const closeWithMotion = useCallback(() => {
    if (reduced) return;
    if (pendingClose.current) return pendingClose.current;
    setClosing(true);
    pendingClose.current = new Promise<void>((resolve) => window.setTimeout(resolve, 130)).finally(() => {
      pendingClose.current = null;
      setClosing(false);
    });
    return pendingClose.current;
  }, [reduced]);
  const renderMenu = useCallback<MenuRenderFn<InsertOption>>((anchor, menu) => (
    anchor.current && (menu.options.length || closing)
      ? <InsertMenu anchor={anchor as RefObject<HTMLElement>} menu={menu} closing={closing} /> : null
  ), [closing]);
  const editor = useCellValue(rootEditor$);
  const readOnly = useCellValue(readOnly$);
  const inTable = useCellValue(editorInTable$);
  const mac = productDocMacShortcuts();
  const commands = useProductDocInsertCommands(locale);
  const options = useMemo(() => commands
    .filter((option) => productDocCommandMatches(option, query ?? ""))
    .map((option) => new InsertOption(option)), [commands, query]);

  useLayoutEffect(() => {
    if (!editor || readOnly || inTable) return;
    return editor.registerCommand(KEY_DOWN_COMMAND, (event) => {
      if (event.defaultPrevented || !editor.isEditable() || !editor.getRootElement()?.contains(event.target as Node)) return false;
      if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="false"]')) return false;
      const id = productDocShortcutCommand(event, mac);
      const command = id && commands.find((option) => option.id === id);
      const selection = $getSelection();
      if (!command || !$isRangeSelection(selection)) return false;
      event.preventDefault();
      command.run(selection);
      return true;
    }, COMMAND_PRIORITY_HIGH);
  }, [editor, commands, inTable, mac, readOnly]);

  return <LexicalTypeaheadMenuPlugin<InsertOption> anchorClassName={styles.anchor}
    commandPriority={COMMAND_PRIORITY_NORMAL} menuRenderFn={renderMenu} onQueryChange={setQuery} onClose={closeWithMotion}
    options={options}
    triggerFn={(text) => {
      const matchingString = productDocCommandQuery(text);
      const selection = $getSelection();
      if (readOnly || inTable || matchingString === null || !$isRangeSelection(selection)) return null;
      const anchor = selection.anchor.getNode();
      const paragraph = anchor.getParent();
      if (anchor.getPreviousSibling() || !$isParagraphNode(paragraph) || !$isRootNode(paragraph.getParent())
        || !commands.some((option) => productDocCommandMatches(option, matchingString))) return null;
      return { leadOffset: 0, matchingString, replaceableString: text };
    }}
    onSelectOption={(option, token, close) => {
      if (token) {
        token.remove();
        const selection = $getSelection();
        option.command.run($isRangeSelection(selection) ? selection : null);
      }
      close();
    }} />;
}

export const productDocCommandsPlugin = realmPlugin({
  init(realm) { realm.pub(addComposerChild$, ProductDocCommands); },
});
