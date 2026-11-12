import { Button } from "@heroui/react";
import { useEffect, useRef } from "react";
import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "./session-revoke-confirmation.module.css";

export function SessionRevokeConfirmation({ label, pending, onConfirm, onCancel }: {
  readonly label: string; readonly pending: boolean; readonly onConfirm: () => void; readonly onCancel: () => void;
}) {
  const { locale } = useTmsLocale(), ru = locale === "ru";
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") return;
    const frame = requestAnimationFrame(() => { if (cancel.current && !cancel.current.disabled) cancel.current.focus(); });
    return () => cancelAnimationFrame(frame);
  }, []);
  return <div className={styles.confirmation} role="group" aria-label={ru ? `Завершить сессию ${label}` : `End ${label} session`}
    onKeyDown={event => { if (event.key === "Escape" && !pending) { event.preventDefault(); event.stopPropagation(); onCancel(); } }}>
    <p className={styles.description}>{ru ? "Для продолжения на этом устройстве потребуется войти снова." : "You’ll need to sign in again on this device."}</p>
    <div className={styles.actions}>
      <Button ref={cancel} autoFocus size="sm" radius="full" variant="light" className={styles.cancel} isDisabled={pending} onPress={onCancel}>{ru ? "Отмена" : "Cancel"}</Button>
      <Button size="sm" radius="full" className={styles.confirm} isDisabled={pending} isLoading={pending} spinner={<LoadingOrb/>} onPress={onConfirm}>{ru ? "Завершить" : "End session"}</Button>
    </div>
  </div>;
}
