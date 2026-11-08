"use client";

import { Button, Listbox, ListboxItem, Spinner } from "@heroui/react";
import { Check, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { useWorkspaceMembers } from "../../../../workspace/members/state/useWorkspaceMembers";
import { PropertyPopover, PropertySearch, PropertyValue } from "../select/PropertySelect";
import styles from "../property-controls.module.css";

type Assignee = { identityId: string; displayName: string } | null;

export function PropertyAssigneeField({
  workspaceId, locale, value, onChange, disabled, compact, autoOpen, offline, includeAgents, onRequestEdit,
}: {
  workspaceId: string;
  locale: TmsLocale;
  value: Assignee;
  onChange?(value: Assignee): void;
  disabled?: boolean;
  compact?: boolean;
  autoOpen?: boolean;
  offline?: boolean;
  includeAgents?: boolean;
  onRequestEdit?(): void;
}) {
  const [open, setOpen] = useState(false);
  const interactive = Boolean(onChange) && !disabled && !offline;
  useEffect(() => {
    if (!interactive) {
      setOpen(false);
    } else if (autoOpen) setOpen(true);
  }, [autoOpen, interactive]);
  const ru = locale === "ru";
  const label = ru ? "Ответственный" : "Assignee";
  const unassigned = ru ? "Не назначен" : "Unassigned";
  const search = ru ? "Назначить…" : "Assign to…";
  const members = useWorkspaceMembers(workspaceId, open && !disabled && !offline);
  const people = members.items.filter((member) => includeAgents || member.kind !== "agent");
  const options = [{ id: "unassigned", name: ru ? unassigned : "No assignee", email: null, kind: "human" as const }, ...people];
  const current = value ? <span className={styles.member}>
    <MemberAvatar workspaceId={workspaceId} identityId={value.identityId} name={value.displayName} offline={offline} />
  </span>
    : <UserRound size={15} aria-hidden="true" />;
  const content = <>{current}<span>{value?.displayName ?? (compact ? label : unassigned)}</span></>;
  const name = `${label}, ${value?.displayName ?? unassigned}`;
  if (!onChange) return <PropertyValue label={name} compact={compact} disabled={disabled || offline} onEdit={onRequestEdit}>{content}</PropertyValue>;
  function setMenu(next: boolean) {
    setOpen(next);
    if (!next) members.setSearch("");
  }
  return <PropertyPopover label={label} triggerLabel={name} trigger={content} compact={compact}
    open={open} disabled={disabled || offline} onOpenChange={setMenu}>
      <PropertySearch label={search} value={members.search} onChange={members.setSearch} />
      <Listbox aria-label={label} classNames={{ base: styles.list, list: styles.options }} items={options}
        itemClasses={{ base: styles.option, title: styles.optionTitle }}
        selectionMode="single" hideSelectedIcon disallowEmptySelection selectedKeys={[value?.identityId ?? "unassigned"]}
        onSelectionChange={(keys) => {
          if (keys === "all") return;
          const key = keys.values().next().value;
          if (key === undefined) return;
          const person = people.find(({ id }) => id === key);
          if (person || key === "unassigned") onChange(person ? { identityId: person.id, displayName: person.name } : null);
          setMenu(false);
        }}>
        {(person) => <ListboxItem key={person.id}
          endContent={person.id === (value?.identityId ?? "unassigned") ? <Check className={styles.selectedIcon} size={14} aria-hidden="true" /> : undefined}
          startContent={person.id === "unassigned" ? <UserRound size={15} aria-hidden="true" />
            : <span className={styles.member}>
              <MemberAvatar workspaceId={workspaceId} identityId={person.id} name={person.name}
                actor={person.kind !== "agent" ? { kind: "human", identityId: person.id, name: person.name, email: person.email ?? null } : undefined} />
            </span>}>
          {person.name}
        </ListboxItem>}
      </Listbox>
      {members.loading && <Spinner size="sm" aria-label={ru ? "Загрузка" : "Loading"} />}
      {members.error && <Button type="button" variant="light" size="sm" onPress={members.retry}>{ru ? "Повторить" : "Retry"}</Button>}
      {members.cursor && <Button type="button" variant="light" size="sm" onPress={members.more}>{ru ? "Ещё" : "More"}</Button>}
  </PropertyPopover>;
}
