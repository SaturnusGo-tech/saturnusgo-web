"use client";

import { LexicalTypeaheadMenuPlugin, MenuOption, type MenuRenderFn } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
  addComposerChild$, applyListType$, convertSelectionToNode$, insertCodeBlock$, insertDirective$,
  insertTable$, insertThematicBreak$, openNewImageDialog$, realmPlugin, usePublisher,
} from "@mdxeditor/editor";
import { $getSelection, $isParagraphNode, $isRangeSelection, $isRootNode, COMMAND_PRIORITY_NORMAL } from "lexical";
import { Braces, Heading2, Heading3, Image, Info, List, ListOrdered, Minus, Quote, SquareCheck, Table2, type LucideIcon } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { productDocCommandQuery } from "./commandQuery";
import styles from "./commands.module.css";

class InsertOption extends MenuOption {
  constructor(
    key: string,
    readonly label: string,
    readonly Icon: LucideIcon,
    readonly insert: () => void,
  ) { super(key); }

  matches(query: string) {
    return this.key.includes(query) || this.label.toLowerCase().includes(query);
  }
}

function InsertMenu({ options, selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }: Parameters<MenuRenderFn<InsertOption>>[1]) {
  const { locale } = useTmsLocale();
  const active = useRef<HTMLLIElement>(null);
  useLayoutEffect(() => {
    const item = active.current;
    const list = item?.parentElement;
    if (!item || !list) return;
    const itemBounds = item.getBoundingClientRect();
    const listBounds = list.getBoundingClientRect();
    const delta = itemBounds.top < listBounds.top
      ? itemBounds.top - listBounds.top : Math.max(0, itemBounds.bottom - listBounds.bottom);
    list.scrollTop += delta;
  }, [options, selectedIndex]);

  return <div className={styles.menu}>
    <span className={styles.label}>{locale === "ru" ? "Вставить" : "Insert"}</span>
    <ul className={styles.options} role="presentation">
      {options.map((option, index) => (
        <li key={option.key} id={`typeahead-item-${index}`} role="option" aria-selected={selectedIndex === index}
          ref={(element) => {
            option.setRefElement(element);
            if (selectedIndex === index) active.current = element;
          }}
          onPointerMove={() => { if (selectedIndex !== index) setHighlightedIndex(index); }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => selectOptionAndCleanUp(option)}>
          <option.Icon size={16} aria-hidden="true" />
          {option.label}
        </li>
      ))}
    </ul>
  </div>;
}

const renderMenu: MenuRenderFn<InsertOption> = (anchor, props) => (
  anchor.current && props.options.length ? createPortal(<InsertMenu {...props} />, anchor.current) : null
);

function ProductDocCommands() {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [query, setQuery] = useState<string | null>(null);
  const changeBlock = usePublisher(convertSelectionToNode$);
  const list = usePublisher(applyListType$);
  const image = usePublisher(openNewImageDialog$);
  const table = usePublisher(insertTable$);
  const code = usePublisher(insertCodeBlock$);
  const directive = usePublisher(insertDirective$);
  const divider = usePublisher(insertThematicBreak$);
  const commands = useMemo(() => [
    new InsertOption("heading", ru ? "Заголовок" : "Heading", Heading2, () => changeBlock(() => $createHeadingNode("h2"))),
    new InsertOption("subheading", ru ? "Подзаголовок" : "Subheading", Heading3, () => changeBlock(() => $createHeadingNode("h3"))),
    new InsertOption("bulleted list", ru ? "Маркированный список" : "Bulleted list", List, () => list("bullet")),
    new InsertOption("numbered list", ru ? "Нумерованный список" : "Numbered list", ListOrdered, () => list("number")),
    new InsertOption("task list", ru ? "Чек-лист" : "Task list", SquareCheck, () => list("check")),
    new InsertOption("table", ru ? "Таблица" : "Table", Table2, () => table({ rows: 3, columns: 3 })),
    new InsertOption("image", ru ? "Изображение" : "Image", Image, () => image()),
    new InsertOption("quote", ru ? "Цитата" : "Quote", Quote, () => changeBlock($createQuoteNode)),
    new InsertOption("note", ru ? "Примечание" : "Note", Info, () => directive({ type: "containerDirective", name: "note" })),
    new InsertOption("code block", ru ? "Блок кода" : "Code block", Braces, () => code({})),
    new InsertOption("divider", ru ? "Разделитель" : "Divider", Minus, () => divider()),
  ], [changeBlock, code, directive, divider, image, list, ru, table]);

  return <LexicalTypeaheadMenuPlugin<InsertOption> anchorClassName={styles.anchor}
    commandPriority={COMMAND_PRIORITY_NORMAL} menuRenderFn={renderMenu} onQueryChange={setQuery}
    options={commands.filter((option) => option.matches(query ?? ""))}
    triggerFn={(text) => {
      const matchingString = productDocCommandQuery(text);
      const selection = $getSelection();
      if (matchingString === null || !$isRangeSelection(selection)) return null;
      const anchor = selection.anchor.getNode();
      const paragraph = anchor.getParent();
      if (anchor.getPreviousSibling() || !$isParagraphNode(paragraph) || !$isRootNode(paragraph.getParent())
        || !commands.some((option) => option.matches(matchingString))) return null;
      return { leadOffset: 0, matchingString, replaceableString: text };
    }}
    onSelectOption={(option, token, close) => {
      if (token) {
        token.remove();
        option.insert();
      }
      close();
    }} />;
}

export const productDocCommandsPlugin = realmPlugin({
  init(realm) { realm.pub(addComposerChild$, ProductDocCommands); },
});
