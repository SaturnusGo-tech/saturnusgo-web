import { Button, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "./security-dialog.module.css";

export function SecurityDialog({ title, pending, onClose, children }: { title: string; pending: boolean; onClose: () => void; children: ReactNode }) {
  const { locale } = useTmsLocale(), reduced = useReducedMotion();
  return <Modal isOpen hideCloseButton placement="center" scrollBehavior="inside" onClose={onClose}
    isDismissable={false} isKeyboardDismissDisabled={pending} disableAnimation={Boolean(reduced)}
    classNames={{ wrapper: styles.wrapper, base: styles.dialog, backdrop: styles.backdrop }}
    motionProps={{ variants: { enter: { opacity: 1, y: 0, scale: 1, transition: { duration: .2 } }, exit: { opacity: 0, y: 6, scale: .99, transition: { duration: .15 } } } }}>
    <ModalContent><ModalHeader className={styles.header}><h2>{title}</h2>
      <Button isIconOnly radius="full" size="sm" variant="light" className={styles.close} isDisabled={pending}
        aria-label={locale === "ru" ? "Закрыть" : "Close"} onPress={onClose}><X size={19} aria-hidden="true"/></Button>
    </ModalHeader><ModalBody className={styles.body}>{children}</ModalBody></ModalContent>
  </Modal>;
}
