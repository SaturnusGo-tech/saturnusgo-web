"use client";

import { Button, Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { Monitor, X } from "lucide-react";
import { useLandingLocale } from "../context/LandingLocaleProvider";
import styles from "./language.module.css";

export function LanguageDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { locale, preference, copy, setLocale } = useLandingLocale();
  const reduceMotion = useReducedMotion();
  const closeLabel = locale === "ru" ? "Закрыть" : "Close";
  const options = [
    { value: "en", label: "English" },
    { value: "ru", label: "Русский" },
    { value: null, label: copy.auto },
  ] as const;

  return (
    <Modal isOpen={open} onOpenChange={onOpenChange} placement="center" scrollBehavior="inside"
      hideCloseButton disableAnimation={reduceMotion ?? false}
      classNames={{ backdrop: styles.backdrop, wrapper: styles.wrapper, base: styles.dialog }}>
      <ModalContent lang={locale}>
        <ModalHeader as="h2" className={styles.header}>{copy.language}</ModalHeader>
        <Button className={styles.close} size="sm" isIconOnly radius="full" variant="light" disableRipple
          aria-label={closeLabel} onPress={() => onOpenChange(false)}>
          <X size={17} aria-hidden="true" />
        </Button>
        <ModalBody className={styles.body}>
          <Listbox aria-label={copy.language} classNames={{ base: styles.listbox, list: styles.options }}
            itemClasses={{ base: styles.option, title: styles.label, selectedIcon: styles.check }}
            selectionMode="single" disallowEmptySelection selectedKeys={[preference ?? "auto"]}>
            {options.map(({ value, label }) => <ListboxItem key={value ?? "auto"} textValue={label}
              startContent={<span className={styles.code} aria-hidden="true">
                {value ? value.toUpperCase() : <Monitor size={15} />}
              </span>}
              onPress={() => {
                setLocale(value);
                onOpenChange(false);
              }}>
              <span lang={value ?? locale}>{label}</span>
            </ListboxItem>)}
          </Listbox>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
