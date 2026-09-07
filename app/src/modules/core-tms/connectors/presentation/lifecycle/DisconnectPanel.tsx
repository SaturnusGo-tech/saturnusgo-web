import { useState } from "react";
import styles from "./disconnect.module.css";
export function DisconnectPanel({ ru, pending, onDisconnect }: {
  ru: boolean; pending: boolean; onDisconnect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return <section className={styles.section}>
    <div><h2>{ru ? "Отсоединить сервис" : "Disconnect service"}</h2><p>{ru ?
      "Остановить обмен и подключить другой проект сервиса. Внешние записи и существующие связи сохранятся; ожидающие события будут отменены. Ключ в самом сервисе не отзывается." :
      "Stop syncing and connect another remote resource. Existing records and links remain; queued events are cancelled. This does not revoke the token at the service."}</p></div>
    {expanded ? <div className={styles.actions}><button type="button" disabled={pending} onClick={onDisconnect}>{ru ? "Подтвердить отсоединение" : "Confirm disconnect"}</button>
      <button type="button" disabled={pending} onClick={() => setExpanded(false)}>{ru ? "Отмена" : "Cancel"}</button></div> :
      <button type="button" disabled={pending} onClick={() => setExpanded(true)}>{ru ? "Отсоединить" : "Disconnect"}</button>}
  </section>;
}
