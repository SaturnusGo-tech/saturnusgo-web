"use client";

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { authoringLeave } from "../application/authoring-leave";
import { useAuthoringHistoryGuard } from "../../../state/navigation/browser/guard/useAuthoringHistoryGuard";
import styles from "./authoring-leave.module.css";

export function AuthoringLeaveHost() {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const [kind, setKind] = useState<"discard" | "busy" | "error" | null>(null);
  const resolve = useRef<((approved: boolean) => void) | undefined>(undefined);
  useAuthoringHistoryGuard();
  useEffect(() => {
    const removePresenter = authoringLeave.setPresenter(next => new Promise(done => {
      resolve.current = done; setKind(next);
    }));
    const unload = (event: BeforeUnloadEvent) => {
      if (!authoringLeave.shouldWarnOnUnload()) return;
      event.preventDefault(); event.returnValue = "";
    };
    window.addEventListener("beforeunload", unload);
    return () => { removePresenter(); resolve.current?.(false); window.removeEventListener("beforeunload", unload); };
  }, []);
  function finish(approved: boolean) { const done = resolve.current; resolve.current = undefined; setKind(null); done?.(approved); }
  const discard = kind === "discard";
  const title = discard ? (ru ? "Выйти без сохранения?" : "Leave without saving?")
    : kind === "busy" ? (ru ? "Сохранение ещё выполняется" : "Saving is still in progress")
      : (ru ? "Не удалось сохранить изменения" : "Changes could not be saved");
  const message = discard ? (ru ? "Внесённые изменения будут потеряны." : "Your unsaved changes will be lost.")
    : kind === "busy" ? (ru ? "Дождитесь завершения и повторите переход." : "Wait for it to finish, then try again.")
      : (ru ? "Вы остались в редакторе. Проверьте соединение и повторите попытку." : "Your editor is still open. Check your connection and try again.");
  return <Modal isOpen={kind !== null} onClose={() => finish(false)} isDismissable={false} disableAnimation
    hideCloseButton shouldBlockScroll={false} placement="center" backdrop="transparent"
    classNames={{ wrapper: styles.wrapper, base: styles.dialog }}>
    <ModalContent data-authoring-confirmation>
      <ModalHeader className={styles.header}>{title}</ModalHeader>
      <ModalBody className={styles.body}><p>{message}</p></ModalBody>
      <ModalFooter className={styles.actions}>
        {discard && <Button radius="full" variant="light" className={styles.discard} onPress={() => finish(true)}>
          {ru ? "Выйти без сохранения" : "Leave without saving"}</Button>}
        <Button autoFocus radius="full" className={styles.stay} onPress={() => finish(false)}>
          {ru ? "Продолжить редактирование" : "Keep editing"}</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>;
}
