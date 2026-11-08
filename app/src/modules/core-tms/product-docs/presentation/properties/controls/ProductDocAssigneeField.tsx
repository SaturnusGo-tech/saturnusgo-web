"use client";

import { Button, Input, Listbox, ListboxItem, Popover, PopoverContent, PopoverTrigger, Spinner } from "@heroui/react";
import { Check, UserRound } from "lucide-react";
import { useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { useWorkspaceMembers } from "../../../../workspace/members/state/useWorkspaceMembers";
import type { ProductDocScope } from "../../../domain/product-docs";
import type { ProductDocProperties } from "../../../domain/properties/product-doc-properties";
import styles from "../product-doc-properties.module.css";

type Assignee = ProductDocProperties["assignee"];

export function ProductDocAssigneeField({ scope, locale, value, onChange, disabled, compact }: {
  scope: ProductDocScope;
  locale: TmsLocale;
  value: Assignee;
  onChange?(value: Assignee): void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ru = locale === "ru";
  const label = ru ? "Ответственный" : "Assignee";
  const unassigned = ru ? "Не назначен" : "Unassigned";
  const search = ru ? "Найти по имени или почте" : "Find by name or email";
  const members = useWorkspaceMembers(scope.workspaceId, open && !disabled);
  const people = members.items.filter((member) => member.kind !== "agent");
  const options = [{ id: "unassigned", name: ru ? unassigned : "No assignee", email: null }, ...people];
  const current = value ? <span className={styles.member}>
    <MemberAvatar workspaceId={scope.workspaceId} identityId={value.identityId} name={value.displayName} />
  </span>
    : <UserRound size={15} aria-hidden="true" />;
  const content = <>{current}<span>{value?.displayName ?? (compact ? label : unassigned)}</span></>;
  if (!onChange) return <div className={styles.value} data-compact={compact || undefined}
    aria-label={`${label}, ${value?.displayName ?? unassigned}`}>{content}</div>;
  return <Popover placement="bottom-start" offset={4} isOpen={open && !disabled} onOpenChange={(next) => {
    setOpen(next);
    if (!next) members.setSearch("");
  }} classNames={{ base: styles.positioner, content: styles.popover }}>
    <PopoverTrigger><Button type="button" variant="light" className={styles.trigger} isDisabled={disabled} data-compact={compact || undefined}
      aria-label={`${label}, ${value?.displayName ?? unassigned}`}>{content}</Button></PopoverTrigger>
    <PopoverContent aria-label={label}>
      <Input autoFocus size="sm" type="search" aria-label={search} placeholder={ru ? "Назначить…" : "Assign to…"}
        classNames={{ base: styles.search, inputWrapper: styles.searchWrapper, input: styles.searchInput }}
        value={members.search} onValueChange={members.setSearch} />
      <Listbox aria-label={label} classNames={{ base: styles.list, list: styles.options }} items={options}
        itemClasses={{ base: styles.option, title: styles.optionTitle }}
        selectionMode="single" hideSelectedIcon disallowEmptySelection selectedKeys={[value?.identityId ?? "unassigned"]}
        onSelectionChange={(keys) => {
          if (keys === "all") return;
          const key = keys.values().next().value;
          if (key === undefined) return;
          const person = people.find(({ id }) => id === key);
          if (person || key === "unassigned") onChange(person ? { identityId: person.id, displayName: person.name } : null);
          setOpen(false);
          members.setSearch("");
        }}>
        {(person) => <ListboxItem key={person.id}
          endContent={person.id === (value?.identityId ?? "unassigned") ? <Check className={styles.selectedIcon} size={14} aria-hidden="true" /> : undefined}
          startContent={person.id === "unassigned" ? <UserRound size={15} aria-hidden="true" />
            : <span className={styles.member}>
              <MemberAvatar workspaceId={scope.workspaceId} identityId={person.id} name={person.name}
                actor={{ kind: "human", identityId: person.id, name: person.name, email: person.email ?? null }} />
            </span>}>
          {person.name}
        </ListboxItem>}
      </Listbox>
      {members.loading && <Spinner size="sm" aria-label={ru ? "Загрузка" : "Loading"} />}
      {members.error && <Button type="button" variant="light" size="sm" onPress={members.retry}>{ru ? "Повторить" : "Retry"}</Button>}
      {members.cursor && <Button type="button" variant="light" size="sm" onPress={members.more}>{ru ? "Ещё" : "More"}</Button>}
    </PopoverContent>
  </Popover>;
}
