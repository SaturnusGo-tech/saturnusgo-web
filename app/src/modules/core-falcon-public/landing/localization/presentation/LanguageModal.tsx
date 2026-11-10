"use client";

import { Button, Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { X } from "lucide-react";
import { useLandingLocale } from "../context/LandingLocaleProvider";
import styles from "./language.module.css";

const languages = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
] as const;

export function LanguageModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { locale, copy, setLocale } = useLandingLocale();

  return <Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="opaque"
    scrollBehavior="inside" hideCloseButton
    classNames={{ base: styles.dialog, backdrop: styles.scrim }}>
    <ModalContent>
      {(dismiss) => <>
        <ModalHeader className={styles.header}>
          {copy.language}
          <Button type="button" isIconOnly size="sm" radius="full" variant="light"
            className={styles.close} aria-label={copy.close} onPress={dismiss}>
            <X size={16} aria-hidden="true" />
          </Button>
        </ModalHeader>
        <ModalBody className={styles.content}>
          <Listbox autoFocus="selected" aria-label={copy.language} classNames={{ base: styles.listbox, list: styles.options }}
            itemClasses={{ base: styles.option, title: styles.label, selectedIcon: styles.check }}
            selectionMode="single" disallowEmptySelection selectedKeys={[locale]}>
            {languages.map(({ value, label }) => <ListboxItem key={value} textValue={label}
              startContent={<span className={styles.code} aria-hidden="true">{value.toUpperCase()}</span>}
              onPress={() => {
                setLocale(value);
                dismiss();
              }}>
              <span lang={value}>{label}</span>
            </ListboxItem>)}
          </Listbox>
        </ModalBody>
      </>}
    </ModalContent>
  </Modal>;
}
