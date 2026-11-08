import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./caseMetadata.module.css";

export type MetadataOption<T extends string> = {
  value: T;
  label: string;
  icon: ReactNode;
  tone: string;
};

export function MetadataSelect<T extends string>({
  label, value, options, onChange, autoFocus, autoOpen = false,
}: {
  label: string;
  value: T;
  options: readonly MetadataOption<T>[];
  onChange: (value: T) => void;
  autoFocus?: boolean;
  autoOpen?: boolean;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    if (!autoOpen) return;
    trigger.current?.focus({ preventScroll: true });
    setOpen(true);
  }, [autoOpen]);
  const selected = options.find((option) => option.value === value) ?? options[0];
  return <div className={styles.select}>
    <Dropdown placement="bottom-start" isOpen={open} onOpenChange={setOpen}
      shouldBlockScroll={false} classNames={{ base: styles.overlay, content: styles.menu }}>
      <DropdownTrigger>
        <Button ref={trigger} className={`${styles.trigger} ${selected?.tone ?? ""}`} aria-label={label} autoFocus={autoFocus} size="sm">
          <span className={styles.triggerLabel}>{selected?.icon}{selected?.label}</span>
          <ChevronDown size={13} aria-hidden="true" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label={label} selectionMode="single" disallowEmptySelection selectedKeys={[value]}
        classNames={{ base: styles.listbox, list: styles.list }} itemClasses={{ base: styles.option, selectedIcon: styles.optionCheck }}>
        {options.map((option) => <DropdownItem key={option.value} textValue={option.label} onPress={() => onChange(option.value)}>
          <span className={styles.optionLabel}>{option.icon}<span>{option.label}</span></span>
        </DropdownItem>)}
      </DropdownMenu>
    </Dropdown>
  </div>;
}
