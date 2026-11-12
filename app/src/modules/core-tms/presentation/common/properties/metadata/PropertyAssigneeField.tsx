"use client";

import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { Button, Listbox, ListboxItem } from "@heroui/react";
import { Check, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { MemberProfilePreview } from "../../../../workspace/members/presentation/profile/MemberProfilePreview";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { useWorkspaceMembers } from "../../../../workspace/members/state/useWorkspaceMembers";
import { PropertyPopover, PropertySearch, PropertyValue } from "../select/PropertySelect";
import styles from "../property-controls.module.css";

type Assignee = { identityId: string; displayName: string } | null;

export function PropertyAssigneeField({
  workspaceId, locale, value, onChange, disabled, compact, autoOpen, offline, includeAgents, onRequestEdit, portalContainer, profilePreview = false,
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
  portalContainer?: HTMLElement;
  profilePreview?: boolean;
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
  const avatar = value && <MemberAvatar workspaceId={workspaceId} identityId={value.identityId} name={value.displayName} offline={offline} />;
  const current = value ? <span className={styles.member}>
    {profilePreview && (onChange || onRequestEdit) ? <MemberProfilePreview workspaceId={workspaceId} identityId={value.identityId} name={value.displayName}
      locale={locale} offline={offline} hoverOnly disabled={open}>{avatar}</MemberProfilePreview> : avatar}
  </span>
    : <UserRound size={15} aria-hidden="true" />;
  const content = <>{current}<span>{value?.displayName ?? (compact ? label : unassigned)}</span></>;
  const name = `${label}, ${value?.displayName ?? unassigned}`;
  if (!onChange) return <PropertyValue label={name} compact={compact} disabled={disabled || offline} onEdit={onRequestEdit}>
    {profilePreview && value && !onRequestEdit ? <MemberProfilePreview workspaceId={workspaceId} identityId={value.identityId}
      name={value.displayName} locale={locale} offline={offline} triggerLabel={name}>{content}</MemberProfilePreview> : content}
  </PropertyValue>;
  function setMenu(next: boolean) {
    setOpen(next);
    if (!next) members.setSearch("");
  }
  const choose = (id: string) => {
    const person = people.find((option) => option.id === id);
    if (person || id === "unassigned") onChange(person ? { identityId: person.id, displayName: person.name } : null);
    setMenu(false);
  };
  const shortcuts = new Map(members.search ? [] : options.slice(0, 10).map((person, index) => [person.id, String(index)]));
  return <PropertyPopover label={label} triggerLabel={name} trigger={content} compact={compact} narrow
    open={open} portalContainer={portalContainer} disabled={disabled || offline} onOpenChange={setMenu} onMenuKeyDown={(event) => {
      if (members.search || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !/^[0-9]$/.test(event.key)) return;
      const option = options[Number(event.key)];
      if (!option) return;
      event.preventDefault();
      event.stopPropagation();
      choose(option.id);
    }}>
      <PropertySearch label={search} value={members.search} onChange={members.setSearch} />
      <Listbox aria-label={label} classNames={{ base: styles.list, list: styles.options }} items={options}
        itemClasses={{ base: styles.option, title: styles.optionTitle }}
        selectionMode="single" hideSelectedIcon disallowEmptySelection selectedKeys={[value?.identityId ?? "unassigned"]}>
        {(person) => <ListboxItem key={person.id} textValue={person.name} onPress={() => choose(person.id)}
          endContent={<span className={styles.optionEnd} aria-hidden="true">
            {person.id === (value?.identityId ?? "unassigned") && <Check className={styles.selectedIcon} size={14} />}
            {shortcuts.has(person.id) && <span className={styles.menuShortcut}>{shortcuts.get(person.id)}</span>}
          </span>}
          startContent={person.id === "unassigned" ? <UserRound size={15} strokeDasharray="2 2" aria-hidden="true" />
            : <span className={styles.member}>
              <MemberAvatar workspaceId={workspaceId} identityId={person.id} name={person.name}
                actor={person.kind !== "agent" ? { kind: "human", identityId: person.id, name: person.name, email: person.email ?? null } : undefined} />
            </span>}>
          {person.name}
        </ListboxItem>}
      </Listbox>
      {members.loading && <LoadingOrb label={ru ? "Загрузка" : "Loading"} />}
      {members.error && <Button type="button" variant="light" size="sm" onPress={members.retry}>{ru ? "Повторить" : "Retry"}</Button>}
      {members.cursor && <Button type="button" variant="light" size="sm" onPress={members.more}>{ru ? "Ещё" : "More"}</Button>}
  </PropertyPopover>;
}
