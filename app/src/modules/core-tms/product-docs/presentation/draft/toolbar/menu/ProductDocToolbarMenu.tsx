"use client";
import { AnchoredDropdown as Dropdown } from "../../../../../../../shared/components/anchored-popup/dropdown/AnchoredDropdown";

import { Button, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { ProductDocTooltip } from "../../../overlay/ProductDocTooltip";
import { useProductDocToolbarSelection } from "./useProductDocToolbarSelection";
import styles from "./toolbar-menu.module.css";

type Item<Value> = { value: Value; label: string; content?: ReactNode };

type ToolButtonProps = Omit<ComponentProps<typeof Button>, "ref"> & { label: string };

export const ProductDocToolbarButton = forwardRef<HTMLButtonElement, ToolButtonProps>(function ProductDocToolbarButton(
  { label, ...props }, ref,
) {
  return <ProductDocTooltip label={label}>
    <Button ref={ref} data-doc-toolbar-trigger size="sm" variant="light" disableRipple aria-label={label} {...props} />
  </ProductDocTooltip>;
});

export function ProductDocToolbarMenu<Value extends string>({ title, children, items, selected, disabled, onChoose, menuId, className, portalContainer }: {
  title: string;
  children: ReactNode;
  items: Item<Value>[];
  selected?: Value;
  disabled?: boolean;
  menuId?: string;
  className?: string;
  portalContainer?: HTMLElement;
  onChoose(value: Value): void;
}) {
  const reduced = useReducedMotion();
  const selection = useProductDocToolbarSelection();

  return <Dropdown placement="bottom-start" offset={6} containerPadding={10} shouldBlockScroll={false} shouldCloseOnScroll={false}
    portalContainer={portalContainer} disableAnimation={Boolean(reduced)}
    data-doc-toolbar-overlay={menuId} classNames={{ base: styles.positioner, content: styles.surface }} style={{ zIndex: 160 }}>
    <DropdownTrigger>
      <ProductDocToolbarButton label={title} isDisabled={disabled} className={className ? `${styles.trigger} ${className}` : styles.trigger}
        onPointerDownCapture={selection.remember} onKeyDownCapture={selection.rememberOnKey}>
        {children}<ChevronDown size={11} aria-hidden="true" />
      </ProductDocToolbarButton>
    </DropdownTrigger>
    <DropdownMenu id={menuId} aria-label={title} data-editor-dialog classNames={{ base: styles.viewport, list: styles.list }}
      itemClasses={{ base: styles.item, title: styles.label }} onAction={(key) => {
        const item = items.find(({ value }) => value === key);
        if (!item) return;
        selection.restore();
        onChoose(item.value);
        selection.focusEditor();
      }}>
      {items.map((item) => <DropdownItem key={item.value} textValue={item.label}
        aria-current={item.value === selected || undefined}
        endContent={item.value === selected ? <Check size={14} aria-hidden="true" /> : undefined}>
        {item.content ?? item.label}
      </DropdownItem>)}
    </DropdownMenu>
  </Dropdown>;
}
