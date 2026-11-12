"use client";
import { AnchoredDropdown as Dropdown } from "../../../../../../../../../shared/components/anchored-popup/dropdown/AnchoredDropdown";

import { Button, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { Copy, EllipsisVertical, MousePointer2, Trash2 } from "lucide-react";
import styles from "../../product-doc-structured.module.css";

export function StructuredBlockMenu({ ru, onCopy, onSelect, onRemove }: {
  ru: boolean; onCopy(): void; onSelect(): void; onRemove(): void;
}) {
  const label = ru ? "Действия блока" : "Block actions";
  return <Dropdown placement="bottom-start" classNames={{ content: styles.menu }}>
    <DropdownTrigger>
      <Button type="button" variant="light" size="sm" disableRipple isIconOnly className={styles.handle}
        aria-label={label}><EllipsisVertical size={15} aria-hidden="true" /></Button>
    </DropdownTrigger>
    <DropdownMenu aria-label={label} itemClasses={{ base: styles.menuItem }} onAction={key => {
      if (key === "copy") onCopy();
      if (key === "select") onSelect();
      if (key === "delete") onRemove();
    }}>
      <DropdownItem key="copy" startContent={<Copy size={14} aria-hidden="true" />}>{ru ? "Копировать исходник" : "Copy source"}</DropdownItem>
      <DropdownItem key="select" startContent={<MousePointer2 size={14} aria-hidden="true" />}>{ru ? "Выделить исходник" : "Select source"}</DropdownItem>
      <DropdownItem key="delete" startContent={<Trash2 size={14} aria-hidden="true" />}>{ru ? "Удалить" : "Delete"}</DropdownItem>
    </DropdownMenu>
  </Dropdown>;
}
