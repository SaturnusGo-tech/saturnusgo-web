"use client";

import { Button, Drawer, DrawerContent, DrawerHeader } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import styles from "../picker/run-evidence-inspector.module.css";

export function RunEvidenceDrawer({ open, onClose, children }: { open: boolean; onClose(): void; children: ReactNode }) {
  const { locale } = useTmsLocale();
  const reduced = useReducedMotion();
  const ru = locale === "ru";
  const title = ru ? "Выберите прогон" : "Choose a run";
  const close = ru ? "Закрыть выбор прогона" : "Close run picker";
  return <Drawer isOpen={open} onClose={onClose} placement="right" scrollBehavior="inside"
    isDismissable={false} hideCloseButton disableAnimation={Boolean(reduced)}
    classNames={{ wrapper: styles.wrapper, backdrop: styles.backdrop, base: styles.drawer }}>
    <DrawerContent>
      <header className={styles.header}>
        <DrawerHeader as="h2">{title}</DrawerHeader>
        <Button disableRipple isIconOnly variant="light" size="sm" className={styles.close} aria-label={close} title={close} onPress={onClose}>
          <X size={16} aria-hidden="true" />
        </Button>
      </header>
      {children}
    </DrawerContent>
  </Drawer>;
}
