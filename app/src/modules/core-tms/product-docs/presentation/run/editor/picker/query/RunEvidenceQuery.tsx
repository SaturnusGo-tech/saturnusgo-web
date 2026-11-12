"use client";
import { AnchoredPopover as Popover } from "../../../../../../../../shared/components/anchored-popup/popover/AnchoredPopover";

import { Button, Input, Listbox, ListboxItem, PopoverContent } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { CodeXml, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { TmsLocale } from "../../../../../../localization/model/locale";
import type { QueryMember } from "../../../../../../presentation/cases/model/query/match";
import { parseCaseQuery } from "../../../../../../presentation/cases/model/query/parse";
import { insertQuerySuggestion, querySuggestions, type QuerySuggestion } from "../../../../../../presentation/cases/toolbar/ql/suggestions/query-suggestions";
import pickerStyles from "../run-evidence-inspector.module.css";
import styles from "./run-evidence-query.module.css";

type Props = {
  locale: TmsLocale;
  query: string;
  open: boolean;
  disabled: boolean;
  instantClose: boolean;
  folders: string[];
  components: string[];
  tags: string[];
  members: readonly QueryMember[];
  onOpenChange(open: boolean): void;
  onQuery(query: string): void;
};

export function RunEvidenceQuery({ open, instantClose, onOpenChange, ...props }: Props) {
  const trigger = useRef<HTMLButtonElement>(null!);
  const panelId = useId();
  const reduced = useReducedMotion();
  const label = props.locale === "ru" ? "QL-запрос" : "QL query";
  return <Popover triggerRef={trigger} isOpen={open} onOpenChange={onOpenChange}
    placement="bottom-end" offset={10} containerPadding={14} shouldBlockScroll={false}
    shouldCloseOnScroll={false} disableAnimation={instantClose || Boolean(reduced)}
    portalContainer={trigger.current?.closest<HTMLElement>('[role="dialog"]') ?? undefined}
    shouldCloseOnInteractOutside={(element) => !element.closest("[data-run-picker-tool]")}
    classNames={{ base: styles.positioner, content: styles.panel }} style={{ zIndex: 5 }}>
    <Button ref={trigger} className={pickerStyles.searchTool} variant="light" size="sm" disableRipple
      isDisabled={props.disabled} data-run-picker-tool="ql" aria-haspopup="dialog" aria-label={label} aria-expanded={open}
      aria-controls={open ? panelId : undefined}
      data-query-invalid={Boolean(parseCaseQuery(props.query).error) || undefined} data-filtered={Boolean(props.query.trim()) || undefined}
      onPress={() => onOpenChange(!open)}>QL</Button>
    {!instantClose && <PopoverContent id={panelId} aria-label={label} onKeyDownCapture={(event) => {
      if (event.key !== "Escape" || event.nativeEvent.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
      requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
    }}>
      <RunQueryFields {...props} />
    </PopoverContent>}
  </Popover>;
}

function RunQueryFields({ locale, query, folders, components, tags, members, disabled, onQuery }: Omit<Props, "open" | "instantClose" | "onOpenChange">) {
  const ru = locale === "ru";
  const label = ru ? "QL-запрос" : "QL query";
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLElement>(null);
  const [caret, setCaret] = useState(query.length);
  const result = querySuggestions(query, caret, { ru, folders, components, tags, members });
  const error = parseCaseQuery(query).error;
  const helpId = useId();

  function apply(suggestion: QuerySuggestion) {
    const next = insertQuerySuggestion(query, result, suggestion);
    onQuery(next.query);
    setCaret(next.caret);
    requestAnimationFrame(() => {
      input.current?.focus({ preventScroll: true });
      input.current?.setSelectionRange(next.caret, next.caret);
    });
  }

  return <>
    <Input ref={input} data-input-shell autoFocus size="sm" variant="flat" radius="lg" aria-label={label} aria-describedby={helpId}
      isInvalid={Boolean(error)} isDisabled={disabled} value={query}
      classNames={{ base: styles.inputBase, inputWrapper: styles.inputWrapper, innerWrapper: styles.inputInner, input: styles.input }}
      placeholder={ru ? "Например, priority:high" : "For example, priority:high"}
      startContent={<CodeXml size={16} aria-hidden="true" />}
      endContent={query && <Button isIconOnly type="button" size="sm" variant="light" disableRipple
        className={styles.clear} aria-label={ru ? "Очистить QL" : "Clear QL"} onPress={() => {
          setCaret(0);
          onQuery("");
          input.current?.focus({ preventScroll: true });
        }}><X size={14} aria-hidden="true" /></Button>}
      onChange={(event) => {
        setCaret(event.currentTarget.selectionStart ?? event.currentTarget.value.length);
        onQuery(event.currentTarget.value);
      }}
      onSelect={(event) => setCaret(event.currentTarget.selectionStart ?? query.length)}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        const options = list.current?.querySelectorAll<HTMLElement>('[role="option"]');
        const index = event.key === "ArrowUp" ? (options?.length ?? 0) - 1 : 0;
        if ((event.key === "ArrowDown" || event.key === "ArrowUp") && options?.[index]) {
          event.preventDefault();
          options[index].focus();
        }
        if (event.key === "Enter" && result.suggestions[0]) {
          event.preventDefault();
          apply(result.suggestions[0]);
        }
      }} />
    <p id={helpId} className={styles.hint} data-invalid={Boolean(error) || undefined} role="status">
      {error ? (ru ? "Дополните условие Falcon QL." : "Complete the Falcon QL condition.")
        : (ru ? "Условия можно объединять через AND, OR и NOT." : "Combine conditions with AND, OR or NOT.")}
    </p>
    {result.suggestions.length > 0 && <Listbox ref={list} classNames={{ base: styles.listbox, list: styles.list }} itemClasses={{ base: styles.option }}
      aria-label={ru ? "Подсказки запроса" : "Query suggestions"}
      onAction={(key) => {
        const suggestion = result.suggestions.find((item) => item.value === key);
        if (suggestion) apply(suggestion);
      }}>
      {result.suggestions.map((item) => <ListboxItem key={item.value} textValue={item.label}
        endContent={(item.field || item.detail) && <code>{item.field ? `${item.value}:` : item.detail}</code>}>
        {item.label}
      </ListboxItem>)}
    </Listbox>}
  </>;
}
