import { Button } from "@heroui/react";
import { ArrowUpRight } from "lucide-react";
import type { NotificationsState } from "../../application/useNotifications";
import styles from "../notifications.module.css";
export function TelegramConnection({ model: m, ru }: { model: NotificationsState; ru: boolean }) {
  if (!m.telegramUrl && !m.settings?.pendingTelegram) return null;
  return <div className={styles.connectionFlow}>
    {m.telegramUrl && !m.settings?.pendingTelegram && <>
      <p>{ru ? "Откройте бота, нажмите Start и вернитесь для подтверждения аккаунта." : "Open the bot, press Start, then return to confirm your account."}</p>
      <div className={styles.actions}>
        <Button as="a" href={m.telegramUrl} target="_blank" rel="noopener noreferrer" size="sm" radius="full" className={styles.primary}>
          {ru ? "Открыть Telegram" : "Open Telegram"}<ArrowUpRight size={15} aria-hidden="true"/>
        </Button>
        <Button size="sm" radius="full" variant="light" className={styles.secondary} isDisabled={m.busy}
          onPress={() => void m.refreshTelegram()}>{ru ? "Я нажал Start" : "I pressed Start"}</Button>
        <Button size="sm" radius="full" variant="light" className={styles.secondary} isDisabled={m.busy}
          onPress={() => void m.linkTelegram()}>{ru ? "Новая ссылка" : "Get a new link"}</Button>
      </div>
    </>}
    {m.settings?.pendingTelegram && <>
      <p>{ru ? "Подключить Telegram-аккаунт" : "Connect Telegram account"} <strong>{m.settings.pendingTelegram.name}</strong>?</p>
      <Button size="sm" radius="full" className={styles.primary} isDisabled={m.busy}
        onPress={() => void m.confirmTelegram()}>{ru ? "Подтвердить аккаунт" : "Confirm account"}</Button>
    </>}
  </div>;
}
