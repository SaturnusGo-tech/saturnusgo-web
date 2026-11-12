import { Button, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { X } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { NotificationsState } from "../../application/useNotifications";
import { AdvancedEventFilters } from "./AdvancedEventFilters";
import styles from "./advanced-filters.module.css";
export function NotificationFiltersDialog({ model, ru, onClose }: { model: NotificationsState; ru: boolean; onClose: () => void }) {
  const [dirty, setDirty] = useState(false);
  const reduced = useReducedMotion();
  return <Modal isOpen disableAnimation={Boolean(reduced)} onClose={onClose} placement="center" scrollBehavior="inside" hideCloseButton
    isDismissable={!model.busy && !dirty} isKeyboardDismissDisabled={model.busy}
    classNames={{ wrapper: styles.wrapper, base: styles.dialog, backdrop: styles.backdrop }}
    motionProps={{ variants: { enter: { opacity: 1, y: 0, scale: 1, transition: { duration: .2 } }, exit: { opacity: 0, y: 8, scale: .99, transition: { duration: .15 } } } }}>
    <ModalContent>
      <ModalHeader className={styles.header}><h2>{ru ? "Дополнительные фильтры" : "Advanced filters"}</h2>
        <Button isIconOnly radius="full" size="sm" variant="light" className={styles.close} isDisabled={model.busy}
          aria-label={ru ? "Закрыть фильтры" : "Close filters"} onPress={onClose}><X size={19} aria-hidden="true"/></Button></ModalHeader>
      <ModalBody className={styles.body}><AdvancedEventFilters model={model} ru={ru} onSaved={onClose} onDirtyChange={setDirty}/></ModalBody>
    </ModalContent>
  </Modal>;
}
