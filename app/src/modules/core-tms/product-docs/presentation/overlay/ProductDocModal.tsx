"use client";

import { Button, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import styles from "./product-doc-overlay.module.css";

export function ProductDocModal({ title, subtitle, closeLabel, onClose, busy, children, className, bodyClassName, isOpen = true }: {
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose(): void;
  busy?: boolean;
  isOpen?: boolean;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const dialog = useRef<HTMLElement>(null);
  const exit = useRef<Animation | null>(null);
  function dismiss() {
    if (busy || exit.current) return;
    const wrapper = dialog.current?.closest<HTMLElement>(`.${styles.wrapper}`);
    if (!wrapper?.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }

    // The dialog and scrim share one animation so they leave on the same frame.
    const animation = wrapper.animate([{ opacity: getComputedStyle(wrapper).opacity }, { opacity: 0 }], {
      duration: 140, easing: "ease-in", fill: "forwards",
    });
    exit.current = animation;
    void animation.finished.then(() => {
      exit.current = null;
      if (wrapper.isConnected) onClose();
    }, () => { exit.current = null; });
  }

  return <Modal ref={dialog} isOpen={isOpen} onClose={dismiss} isDismissable={!busy} isKeyboardDismissDisabled={busy}
    hideCloseButton disableAnimation backdrop="transparent"
    classNames={{ wrapper: styles.wrapper, base: `${styles.dialog} ${className ?? ""}` }}>
    <ModalContent>
      <ModalHeader className={styles.header}>
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <Button size="sm" radius="full" isIconOnly variant="light" isDisabled={busy} className={styles.close}
          aria-label={closeLabel} onPress={dismiss}><X size={17} aria-hidden="true" /></Button>
      </ModalHeader>
      <ModalBody className={`${styles.body} ${bodyClassName ?? ""}`}>{children}</ModalBody>
    </ModalContent>
  </Modal>;
}
