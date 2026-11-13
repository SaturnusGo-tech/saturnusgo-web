"use client";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { Upload, X } from "lucide-react";
import { useRef } from "react";
import { avatarCharacter } from "../../../avatars/content/avatar-characters";
import { useAvatarChoice } from "../../application/avatar/useAvatarChoice";
import { AvatarGallery } from "./AvatarGallery";
import styles from "./avatar-chooser.module.css";

export function AvatarChooser({ currentCharacterId, hasPhoto, pending, ru, onSave, onUpload, onClose }: {
  currentCharacterId: string | null; hasPhoto: boolean; pending: boolean; ru: boolean;
  onSave: (id: string) => Promise<boolean>; onUpload: (file: File) => Promise<boolean>; onClose: () => void;
}) {
  const choice = useAvatarChoice({ currentCharacterId, hasPhoto, onSave, onUpload, onClose });
  const input = useRef<HTMLInputElement>(null), reduced = useReducedMotion(), busy = pending || choice.working;
  const selected = avatarCharacter(choice.selected), selectedName = selected ? ru ? selected.nameRu : selected.name : null;
  return <Modal isOpen hideCloseButton placement="center" scrollBehavior="inside" onClose={onClose}
    isDismissable={!busy} isKeyboardDismissDisabled={busy} shouldBlockScroll disableAnimation={Boolean(reduced)}
    classNames={{ wrapper: styles.wrapper, base: styles.dialog, backdrop: styles.backdrop }}
    motionProps={{ variants: { enter: { opacity: 1, y: 0, scale: 1, transition: { duration: .24, ease: [.16, 1, .3, 1] } },
      exit: { opacity: 0, y: 6, scale: .995, transition: { duration: .16 } } } }}>
    <ModalContent>
      <ModalHeader className={styles.header}><div><h2>{ru ? "Выберите аватар" : "Choose your avatar"}</h2>
        <p>{ru ? "Выберите персонажа Falcon или добавьте своё фото." : "Pick a Falcon character or add your own photo."}</p></div>
        <Button isIconOnly radius="full" variant="light" className={styles.close} isDisabled={busy}
          aria-label={ru ? "Закрыть" : "Close"} onPress={onClose}><X size={22} aria-hidden="true" /></Button>
        <div className={styles.galleryHeading}><h3>{ru ? "Персонажи Falcon" : "Falcon characters"}</h3>
          <Button radius="full" variant="flat" className={styles.upload} isDisabled={busy} onPress={() => input.current?.click()}>
            <Upload size={18} strokeWidth={1.7} aria-hidden="true" />{ru ? "Добавить своё фото" : "Add your photo"}
          </Button></div>
      </ModalHeader>
      <ModalBody className={styles.body}><AvatarGallery selected={choice.selected} disabled={busy} ru={ru} onSelect={choice.select} /></ModalBody>
      <ModalFooter className={styles.footer}><span aria-live="polite">{selectedName ? ru ? `Выбрано: ${selectedName}` : `${selectedName} selected` : hasPhoto ? ru ? "Ваше фото" : "Your photo" : ru ? "Выберите персонажа" : "Choose a character"}</span>
        <Button radius="full" className={styles.save} isDisabled={!choice.changed || busy} isLoading={busy} onPress={() => { void choice.save(); }}>
          {ru ? "Сохранить" : "Save"}
        </Button>
      </ModalFooter>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy}
        aria-label={ru ? "Добавить своё фото" : "Add your photo"} onChange={event => {
          const file = event.target.files?.[0]; event.target.value = ""; if (file) void choice.upload(file);
        }} />
    </ModalContent>
  </Modal>;
}
