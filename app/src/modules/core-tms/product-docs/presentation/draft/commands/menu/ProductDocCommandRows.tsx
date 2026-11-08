"use client";

import { Kbd, ListboxItem, ListboxSection } from "@heroui/react";
import type { TmsLocale } from "../../../../../localization/model/locale";
import { productDocShortcut } from "../keyboard/commandShortcuts";
import type { ProductDocInsertCommand } from "../registry/useProductDocInsertCommands";
import styles from "./commands.module.css";

const labels = {
  headings: { en: "Headings", ru: "Заголовки" },
  lists: { en: "Lists", ru: "Списки" },
  media: { en: "Media and attachments", ru: "Медиа и вложения" },
  blocks: { en: "Content blocks", ru: "Блоки" },
  more: { en: "More options", ru: "Другие элементы" },
} as const;

export function productDocCommandRows(commands: readonly ProductDocInsertCommand[], locale: TmsLocale, mac: boolean,
  virtual?: { selected: number | null }) {
  const groups = new Map<ProductDocInsertCommand["group"], { command: ProductDocInsertCommand; index: number }[]>();
  commands.forEach((command, index) => {
    const existing = groups.get(command.group);
    if (existing) existing.push({ command, index });
    else groups.set(command.group, [{ command, index }]);
  });
  return Array.from(groups, ([group, entries]) => (
    <ListboxSection key={group} aria-label={labels[group][locale]} classNames={{ base: styles.section, group: styles.group }}>
      {entries.map(({ command: { id, label, Icon }, index }) => {
        const shortcut = productDocShortcut(id, mac);
        return <ListboxItem key={id} textValue={label} aria-keyshortcuts={shortcut?.aria}
          id={virtual ? `typeahead-item-${index}` : undefined} data-doc-command-index={virtual ? index : undefined}
          data-highlighted={virtual?.selected === index || undefined}
          startContent={<Icon size={16} aria-hidden="true" />}
          endContent={shortcut ? <Kbd aria-hidden="true" classNames={{ base: styles.shortcut, content: styles.keys }}>{shortcut.display}</Kbd> : undefined}>
          {label}
        </ListboxItem>;
      })}
    </ListboxSection>
  ));
}
