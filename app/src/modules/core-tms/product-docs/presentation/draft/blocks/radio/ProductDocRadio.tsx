"use client";

import { Radio, RadioGroup } from "@heroui/react";
import { readOnly$, useCellValue, useLexicalNodeRemove, useMdastNodeUpdater, type DirectiveDescriptor } from "@mdxeditor/editor";
import { Plus, X } from "lucide-react";
import type { ContainerDirective } from "mdast-util-directive";
import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { ProductDocToolbarButton } from "../../toolbar/menu/ProductDocToolbarMenu";
import { isProductDocRadio, maxRadioOptions, productDocRadioName, readRadioOptions, serializeRadioOptions } from "./radioOptions";
import styles from "./product-doc-radio.module.css";

function ProductDocRadioEditor({ node }: { node: ContainerDirective }) {
  const ru = useTmsLocale().locale === "ru";
  const readOnly = useCellValue(readOnly$);
  const update = useMdastNodeUpdater<ContainerDirective>();
  const removeBlock = useLexicalNodeRemove();
  const fields = useRef<Array<HTMLTextAreaElement | null>>([]);
  const nextFocus = useRef<{ index: number; end: boolean } | null>(null);
  const stored = readRadioOptions(node);
  const options = stored.options.length ? stored.options : [""];
  const { selected } = stored;
  const label = ru ? "Радиокнопки" : "Radio options";
  const optionLabel = (index: number) => (ru ? "Вариант " : "Option ") + (index + 1);

  useLayoutEffect(() => {
    const target = nextFocus.current;
    if (!target) return;
    const field = fields.current[target.index];
    if (!field) return;
    nextFocus.current = null;
    field.focus();
    const caret = target.end ? field.value.length : 0;
    field.setSelectionRange(caret, caret);
  }, [node]);

  function save(next: string[], choice = selected) {
    update(serializeRadioOptions(next, choice));
  }

  function add(index: number, current: string, next = "") {
    if (options.length >= maxRadioOptions) return;
    nextFocus.current = { index: index + 1, end: false };
    save([...options.slice(0, index), current, next, ...options.slice(index + 1)], selected > index ? selected + 1 : selected);
  }

  function remove(index: number) {
    if (options.length === 1) {
      removeBlock();
      return;
    }
    nextFocus.current = { index: Math.max(0, index - 1), end: index > 0 };
    save(options.filter((_, position) => position !== index), selected === index ? -1 : selected > index ? selected - 1 : selected);
  }

  function editKey(event: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const field = event.currentTarget;
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      add(index, field.value.slice(0, field.selectionStart), field.value.slice(field.selectionEnd));
    }
    if (event.key === "Backspace" && !field.value) {
      event.preventDefault();
      event.stopPropagation();
      remove(index);
    }
  }

  return <div contentEditable={false} data-editor-dialog>
    <RadioGroup aria-label={label} value={selected >= 0 ? String(selected) : ""} isReadOnly={readOnly}
      classNames={{ base: styles.group, wrapper: styles.options }} onValueChange={(value) => save(options, Number(value))}>
      {options.map((option, index) => <div className={styles.row} key={index}>
        <Radio value={String(index)} aria-label={option || optionLabel(index)}
          classNames={{ base: styles.radio, wrapper: styles.circle, control: styles.dot, hiddenInput: styles.hiddenInput }} />
        <div className={styles.editorText} data-text={option}>
          <textarea ref={(field) => { fields.current[index] = field; }} className={styles.text} rows={1}
            aria-label={optionLabel(index)} placeholder={ru ? "Вариант" : "Option"} value={option} readOnly={readOnly}
            onChange={(event) => save(options.map((entry, position) => position === index
              ? event.currentTarget.value.replace(/[\r\n]+/g, " ") : entry))}
            onKeyDown={readOnly ? undefined : (event) => editKey(event, index)} />
        </div>
        {!readOnly && <div className={styles.actions}>
          {options.length < maxRadioOptions && <ProductDocToolbarButton label={ru ? "Добавить вариант" : "Add option"}
            isIconOnly className={styles.action} onPress={() => add(index, option)}><Plus size={14} /></ProductDocToolbarButton>}
          <ProductDocToolbarButton label={ru ? "Удалить вариант" : "Remove option"} isIconOnly
            className={styles.action} onPress={() => remove(index)}><X size={13} /></ProductDocToolbarButton>
        </div>}
      </div>)}
    </RadioGroup>
  </div>;
}

export function ProductDocRadioReader({ options, selected }: ReturnType<typeof readRadioOptions>) {
  const ru = useTmsLocale().locale === "ru";
  if (!options.some((option) => option.trim())) return null;
  return <div className={styles.options} role="radiogroup" aria-readonly="true" aria-label={ru ? "Радиокнопки" : "Radio options"}>
    {options.map((option, index) => option.trim() && <div key={index} className={styles.row} role="radio"
      aria-checked={selected === index}><span className={styles.circle} aria-hidden="true">
        {selected === index && <span className={styles.dot} />}
      </span><span className={styles.readerText}>{option}</span></div>)}
  </div>;
}

export const productDocRadio: DirectiveDescriptor<ContainerDirective> = {
  name: productDocRadioName, attributes: ["selected"], type: "containerDirective", hasChildren: true,
  testNode: isProductDocRadio,
  Editor: ({ mdastNode }) => <ProductDocRadioEditor node={mdastNode} />,
};
