import { AnchoredDropdown as Dropdown } from "../../../../../shared/components/anchored-popup/dropdown/AnchoredDropdown";
import { BreadcrumbItem, Breadcrumbs, Button, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { ChevronRight, Ellipsis } from "lucide-react";
import { type ReactNode, useRef } from "react";
import styles from "./workspace-breadcrumbs.module.css";

type Crumb = { id: string; label: string; onPress?: () => void };

export function WorkspaceBreadcrumbs({ label, items, overflowLabel, separator = <ChevronRight size={12} aria-hidden="true" /> }: {
  label: string; items: readonly Crumb[]; overflowLabel?: string; separator?: ReactNode;
}) {
  const hidden = overflowLabel && items.length > 4 ? items.slice(1, -2) : [];
  const overflowButton = useRef<HTMLButtonElement>(null);
  return <Breadcrumbs aria-label={label} size="sm" maxItems={hidden.length ? 5 : items.length + 1}
    itemsBeforeCollapse={1} itemsAfterCollapse={2}
    renderEllipsis={overflowLabel ? ({ separator }) => <li className={styles.overflow}>
      <Dropdown placement="bottom-start" classNames={{ base: styles.positioner, content: styles.menu }}>
        <DropdownTrigger><Button ref={overflowButton} isIconOnly size="sm" variant="light" className={styles.more} aria-label={overflowLabel}
          onPointerDownCapture={(event) => event.currentTarget.focus({ preventScroll: true })}>
          <Ellipsis size={15} aria-hidden="true" />
        </Button></DropdownTrigger>
        <DropdownMenu aria-label={overflowLabel} classNames={{ list: styles.menuList }}
          itemClasses={{ base: styles.menuItem, title: styles.menuLabel }}
          disabledKeys={hidden.filter((item) => !item.onPress).map((item) => item.id)}
          onKeyDownCapture={(event) => {
            if (event.key === "Escape") requestAnimationFrame(() => overflowButton.current?.focus({ preventScroll: true }));
          }}
          onAction={(key) => hidden.find((item) => item.id === key)?.onPress?.()}>
          {hidden.map((item) => <DropdownItem key={item.id}>{item.label}</DropdownItem>)}
        </DropdownMenu>
      </Dropdown>
      {separator}
    </li> : undefined}
    isDisabled={!items.some((item) => item.onPress)} separator={separator}
    classNames={{ base: styles.root, list: styles.list }}
    itemClasses={{ base: styles.crumb, item: styles.item, separator: styles.separator }}>
    {items.map((item) => <BreadcrumbItem key={item.id} onPress={item.onPress}>
      <span className={styles.label}>{item.label}</span>
    </BreadcrumbItem>)}
  </Breadcrumbs>;
}
