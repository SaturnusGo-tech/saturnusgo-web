"use client";

import { Button, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { useReducedMotion, type Variants } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./product-doc-overlay.module.css";

const dialogMotion: Variants = {
  enter: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.22, 0.7, 0.2, 1] } },
  exit: { opacity: 0, y: 6, scale: 0.985, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } },
};

export function ProductDocModal({ title, subtitle, closeLabel, onClose, busy, children, className }: {
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose(): void;
  busy?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  return <Modal isOpen onClose={onClose} isDismissable={!busy} isKeyboardDismissDisabled={busy} hideCloseButton
    disableAnimation={Boolean(reducedMotion)} motionProps={{ variants: dialogMotion }}
    classNames={{ wrapper: styles.wrapper, backdrop: styles.backdrop, base: `${styles.dialog} ${className ?? ""}` }}>
    <ModalContent>
      <ModalHeader className={styles.header}>
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <Button size="sm" radius="full" isIconOnly variant="light" isDisabled={busy} className={styles.close}
          aria-label={closeLabel} onPress={onClose}><X size={17} aria-hidden="true" /></Button>
      </ModalHeader>
      <ModalBody className={styles.body}>{children}</ModalBody>
    </ModalContent>
  </Modal>;
}
