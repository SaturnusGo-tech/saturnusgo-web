"use client";

import { FreeSoloPopover } from "@heroui/popover";
import { Listbox, ListboxItem } from "@heroui/react";
import { Monitor } from "lucide-react";
import { useMemo } from "react";
import { useLandingLocale } from "../context/LandingLocaleProvider";
import styles from "./language.module.css";

export function LanguagePopover({ anchor, id, onClose }: {
  anchor: HTMLButtonElement | null;
  id: string;
  onClose: () => void;
}) {
  const { locale, preference, copy, setLocale } = useLandingLocale();
  const triggerRef = useMemo(() => anchor && { current: anchor }, [anchor]);
  const options = [
    { value: "en", label: "English" },
    { value: "ru", label: "Русский" },
    { value: null, label: copy.auto },
  ] as const;

  if (!triggerRef) return null;

  return (
    <FreeSoloPopover isOpen onClose={onClose} triggerRef={triggerRef}
      placement="bottom-end" offset={8} containerPadding={12} isNonModal shouldBlockScroll={false} shouldCloseOnScroll={false}
      disableAnimation disableDialogFocus
      dialogProps={{ id, "aria-label": copy.language }}
      style={{ zIndex: 60 }}
      classNames={{ base: styles.popover, content: styles.content }}>
      <Listbox autoFocus aria-label={copy.language} classNames={{ base: styles.listbox, list: styles.options }}
        itemClasses={{ base: styles.option, title: styles.label, selectedIcon: styles.check }}
        selectionMode="single" disallowEmptySelection selectedKeys={[preference ?? "auto"]}>
        {options.map(({ value, label }) => <ListboxItem key={value ?? "auto"} textValue={label}
          startContent={<span className={styles.code} aria-hidden="true">
            {value ? value.toUpperCase() : <Monitor size={15} />}
          </span>}
          onPress={() => {
            setLocale(value);
            onClose();
          }}>
          <span lang={value ?? locale}>{label}</span>
        </ListboxItem>)}
      </Listbox>
    </FreeSoloPopover>
  );
}
