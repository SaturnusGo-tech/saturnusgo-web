"use client";

import { Button, Input, Listbox, ListboxItem } from "@heroui/react";
import { Search } from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { MemberAvatar } from "../../../../../../workspace/members/avatar/MemberAvatar";
import { useWorkspaceMembers } from "../../../../../../workspace/members/state/useWorkspaceMembers";
import styles from "./run-filter-popover.module.css";

export type FilterOption = { value: string; label: string; detail?: string | null; icon?: ReactNode };

type Props = {
  label: string;
  options: readonly FilterOption[];
  selected: readonly string[];
  onChange(values: string[]): void;
  ru: boolean;
  single?: boolean;
  placeholder?: string;
  allowCustom?: boolean;
  search?: string;
  onSearch?(search: string): void;
  children?: ReactNode;
};

const resetKey = "reset";

export function RunEvidenceFilterSearch({ label, value, onChange }: {
  label: string; value: string; onChange(value: string): void;
}) {
  return <div className={styles.search} data-input-shell>
    <Input type="search" aria-label={label} placeholder={label} value={value} onValueChange={onChange}
      size="sm" variant="flat"
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "ArrowDown") return;
        const first = event.currentTarget.closest("[data-filter-page]")?.querySelector<HTMLElement>("[role=option], [data-folder-filter-option]");
        if (first) { event.preventDefault(); first.focus({ preventScroll: true }); }
      }}
      startContent={<Search size={14} aria-hidden="true" />}
      classNames={{ input: styles.input, inputWrapper: styles.inputWrapper, innerWrapper: styles.inputInner }} />
  </div>;
}

export function RunEvidenceFilterOptions({
  label, options, selected, onChange, ru, single, placeholder, allowCustom, search, onSearch, children,
}: Props) {
  const [input, setInput] = useState("");
  const value = search ?? input;
  const term = value.trim();
  const visible = onSearch ? [...options] : options.filter((option) =>
    `${option.label} ${option.value} ${option.detail ?? ""}`.toLocaleLowerCase().includes(term.toLocaleLowerCase()));
  if (allowCustom && term && term.length <= 256 && !visible.some((option) => option.value === term)) {
    visible.push({ value: term, label: term });
  }
  const items = [{ key: resetKey, label: single ? (ru ? "Без группировки" : "No grouping") : (ru ? "Все" : "All") },
    ...visible.map((option) => ({ ...option, key: `value:${option.value}` }))];
  return <>
    {placeholder && <RunEvidenceFilterSearch label={placeholder} value={value} onChange={onSearch ?? setInput} />}
    <Listbox aria-label={label} selectionMode={single ? "single" : "multiple"} selectionBehavior="toggle"
      items={items} selectedKeys={selected.length ? selected.map((id) => `value:${id}`) : [resetKey]}
      onSelectionChange={(keys) => {
        if (keys === "all" || (keys.has(resetKey) && selected.length)) return onChange([]);
        onChange([...keys].filter((key) => key !== resetKey).map((key) => String(key).slice(6)));
      }}
      classNames={{ base: styles.listbox, list: styles.list }} variant="light" itemClasses={{ base: styles.row, selectedIcon: styles.selected }}>
      {(option) => <ListboxItem key={option.key} textValue={option.label} startContent={"icon" in option ? option.icon : undefined}>
        <span className={styles.optionLabel}>{option.label}</span>
        {"detail" in option && option.detail && <small className={styles.detail}>{option.detail}</small>}
      </ListboxItem>}
    </Listbox>
    {visible.length === 0 && term && !onSearch && <p className={styles.note}>{ru ? "Совпадений нет." : "No matches."}</p>}
    {children}
  </>;
}

export function RunEvidenceAssigneeOptions({ workspaceId, selected, onChange, ru, label }: {
  workspaceId: string; selected: string[]; onChange(values: string[]): void; ru: boolean; label: string;
}) {
  const members = useWorkspaceMembers(workspaceId, true);
  return <RunEvidenceFilterOptions label={label} selected={selected} onChange={onChange} ru={ru}
    options={[{ value: "unassigned", label: ru ? "Не назначен" : "Unassigned" }, ...members.items.map((member) => ({
      value: member.id, label: member.name, detail: member.email, icon: <MemberAvatar identityId={member.id} name={member.name} />,
    }))]}
    search={members.search} onSearch={members.setSearch} placeholder={ru ? "Имя или почта" : "Name or email"}>
    {members.loading && <p className={styles.note} role="status">{ru ? "Загрузка участников…" : "Loading members…"}</p>}
    {members.error && <Button className={styles.action} onPress={members.retry}>{ru ? "Повторить загрузку" : "Retry loading"}</Button>}
    {members.cursor && !members.error && <Button className={styles.action} isDisabled={members.loading} onPress={members.more}>
      {ru ? "Загрузить ещё" : "Load more"}
    </Button>}
  </RunEvidenceFilterOptions>;
}
