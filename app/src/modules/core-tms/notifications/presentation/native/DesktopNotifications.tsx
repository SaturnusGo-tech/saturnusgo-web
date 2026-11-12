import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { desktopNotificationCommand } from "../../domain/native/desktop-notification-command";
import styles from "../notifications.module.css";
export function DesktopNotifications({ ru, workspaceId }: { ru: boolean; workspaceId?: string }) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const read = () => setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    window.addEventListener("focus", read);
    return () => { mounted.current = false; window.removeEventListener("focus", read); };
  }, []);
  const systemCommand = workspaceId ? desktopNotificationCommand(workspaceId, "notification-permission") : null;
  async function allow() {
    if (busy || typeof Notification === "undefined") return;
    setBusy(true); setError(false);
    try { const next = await Notification.requestPermission(); if (mounted.current) setPermission(next); } catch { if (mounted.current) setError(true); }
    finally { if (mounted.current) setBusy(false); }
  }
  return <section className={styles.section} data-channel="desktop" aria-labelledby="notification-desktop-title">
    <div className={styles.sectionCopy}><h2 id="notification-desktop-title">{ru ? "Уведомления на компьютере" : "Desktop notifications"}</h2>
      <p>{ru ? "Уведомления о достижениях, пока приложение Falcon работает." : "Achievement notifications while the Falcon app is running."}</p></div>
    <div className={styles.options}><div className={styles.nativeControl}>
      <strong>{ru ? "Разрешение для Falcon" : "Falcon permission"}</strong>
      <p>{permission === "granted" ? (ru ? "Уведомления разрешены для этой сессии Falcon." : "Notifications are allowed for this Falcon session.")
        : permission === "unsupported" ? (ru ? "Уведомления недоступны на этом устройстве." : "Notifications are unavailable on this device.")
        : permission === "denied" ? (ru ? "Разрешите уведомления для этой сессии Falcon. При необходимости проверьте системные настройки." : "Allow notifications for this Falcon session. Check system settings if needed.")
        : (ru ? "Разрешите Falcon показывать уведомления на этом устройстве." : "Allow Falcon to display notifications on this device.")}</p>
      <div className={styles.actions}>
        {permission !== "granted" && permission !== "unsupported" && <Button size="sm" radius="full" className={styles.secondary} isDisabled={busy} onPress={() => void allow()}>{ru ? "Разрешить уведомления" : "Allow notifications"}</Button>}
        {systemCommand && <Button as="a" href={systemCommand} size="sm" radius="full" variant="light" className={styles.secondary}>{ru ? "Системные настройки" : "System settings"}</Button>}
      </div>
    </div></div>
    <ErrorToast message={error ? (ru ? "Не удалось запросить разрешение на уведомления." : "Notification permission could not be requested.") : null}/>
  </section>;
}
