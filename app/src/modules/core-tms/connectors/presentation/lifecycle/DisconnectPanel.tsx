import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { useState } from "react";
import styles from "./disconnect.module.css";
export function DisconnectPanel({ ru, pending, onDisconnect, specification = false }: {
  ru: boolean; pending: boolean; specification?: boolean; onDisconnect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return <section className={styles.section}>
    <div><h2>{ru ? "Отсоединить сервис" : "Disconnect service"}</h2><p>{specification ? (ru ? "Убрать спецификацию из API Testing и удалить сохранённые данные доступа. Тест-кейсы и результаты сохранятся. После отсоединения можно подключить новый адрес." : "Remove the specification from API Testing and delete stored credentials. Cases and results remain. You can then connect a different URL.") : ru ?
      "Остановить обмен и подключить другой проект сервиса. Внешние записи и существующие связи сохранятся; ожидающие события будут отменены. Ключ в самом сервисе не отзывается." :
      "Stop syncing and connect another remote resource. Existing records and links remain; queued events are cancelled. This does not revoke the token at the service."}</p></div>
    {expanded ? <div className={styles.actions}><IntegrationButton type="button" isDisabled={pending} onPress={onDisconnect}>{ru ? "Подтвердить отсоединение" : "Confirm disconnect"}</IntegrationButton>
      <IntegrationButton type="button" isDisabled={pending} onPress={() => setExpanded(false)}>{ru ? "Отмена" : "Cancel"}</IntegrationButton></div> :
      <IntegrationButton type="button" isDisabled={pending} onPress={() => setExpanded(true)}>{ru ? "Отсоединить" : "Disconnect"}</IntegrationButton>}
  </section>;
}
