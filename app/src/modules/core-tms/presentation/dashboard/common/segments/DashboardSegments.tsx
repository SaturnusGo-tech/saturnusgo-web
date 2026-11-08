"use client";

import { Tab, Tabs } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import styles from "./segments.module.css";

type Segment<Key extends string> = { key: Key; label: string; badge?: number | string };
type Props<Key extends string> = {
  label: string;
  panelId: string;
  selectedKey: Key;
  items: ReadonlyArray<Segment<Key>>;
  onSelect(key: Key): void;
  listClassName: string;
  tabClassName?: string;
  disabled?: boolean;
};

export const dashboardTabId = (panelId: string, key: string) => `${panelId}-${key}`;

export function DashboardSegments<Key extends string>({
  label, panelId, selectedKey, items, onSelect, listClassName, tabClassName, disabled,
}: Props<Key>) {
  const reducedMotion = useReducedMotion();
  return <Tabs aria-label={label} selectedKey={selectedKey} isDisabled={disabled} size="sm"
    disableAnimation={reducedMotion === true}
    motionProps={{ transition: { type: "spring", duration: .32, bounce: 0 } }}
    classNames={{
      tabList: `${styles.list} ${listClassName}`,
      tab: `${styles.tab} ${tabClassName ?? ""}`,
      tabContent: styles.content,
      cursor: styles.cursor,
    }}
    onSelectionChange={(key) => {
      const item = items.find((option) => option.key === key);
      if (item) onSelect(item.key);
    }}>
    {items.map(({ key, label: title, badge }) =>
      <Tab key={key} id={dashboardTabId(panelId, key)} aria-controls={panelId} aria-label={badge === undefined ? title : `${title} ${badge}`}
        title={badge === undefined ? title : <>{title}<span className={styles.badge}>{badge}</span></>} />)}
  </Tabs>;
}
