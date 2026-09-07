import { CheckCircle2, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { Provider, ConnectionInput, Discovery, Snapshot } from "../../model/connector-types";
import { providerCopy } from "../../localization/connector-copy";
import { CredentialFields } from "./CredentialFields";
import styles from "../styles/connector.module.css";
export function ConnectionPanel({ provider, ru, draft, snapshot, discovery, pending, onChange, onDiscover }: {
  provider: Provider; ru: boolean; draft: ConnectionInput; snapshot: Snapshot;
  discovery: Discovery | null; pending: string | null; onChange: (value: ConnectionInput) => void; onDiscover: () => void;
}) {
  const copy = providerCopy(provider, ru); const [copied, setCopied] = useState(false);
  const webhook = ["jira", "trello", "linear", "github"].includes(provider);
  const settings = draft.settings;
  return <div className={styles.setupGrid}>
    <CredentialFields provider={provider} ru={ru} draft={draft} stored={Boolean(snapshot.connection?.credentialsConfigured)}
      bound={Boolean(snapshot.connection)} onChange={onChange} />
    <section className={styles.panel}>
      <header><span className={styles.step}>2</span><h2>{ru ? "Куда попадут результаты" : "Where results go"}</h2></header>
      <p>{provider === "slack" ? (ru ? "Выбранный канал получает только отмеченные события." : "The chosen channel receives selected events.") :
        provider === "github" ? (ru ? "Наборы тестов и окружения задаются в разделе автоматизации." : "Choose test suites and environments in Automation.") :
          (ru ? "Проверьте доступ, затем выберите ресурс сервиса." : "Verify access, then select a service resource.")}</p>
      {provider === "confluence" && <label>{copy.destination}<input value={settings.destinationId}
        onChange={(e) => onChange({ ...draft, settings: { ...settings, destinationId: e.target.value } })} /></label>}
      {["jira", "trello"].includes(provider) && <label>{copy.destination}
        {discovery ? <select value={settings.destinationId} onChange={(e) => onChange({ ...draft, settings: { ...settings, destinationId: e.target.value } })}>
          <option value="">{ru ? "Выберите значение" : "Select a value"}</option>
          {discovery.destinations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select> : <input value={settings.destinationId} placeholder={ru ? "ID или выбор после проверки" : "ID or select after verification"}
          onChange={(e) => onChange({ ...draft, settings: { ...settings, destinationId: e.target.value } })} />}</label>}
      <button type="button" className={styles.secondary} disabled={Boolean(pending)} onClick={onDiscover}>
        <ShieldCheck size={16} />{pending === "discover" ? (ru ? "Проверяем…" : "Verifying…") : (ru ? "Проверить доступ" : "Verify access")}</button>
      {discovery && <div className={styles.verified}><CheckCircle2 size={18} /><div><strong>{discovery.account}</strong>
        {discovery.resources.map((item) => <p key={item.id}>{item.name} <code>{item.id}</code></p>)}</div></div>}
      {snapshot.connection?.checkedAt && <small>{ru ? "Последняя проверка: " : "Last verified: "}
        {new Date(snapshot.connection.checkedAt).toLocaleString(ru ? "ru-RU" : "en-US")}</small>}
    </section>
    <section className={styles.panel}>
      <header><span className={styles.step}>3</span><h2>{webhook ? (ru ? "Обратная связь" : "Incoming events") : (ru ? "Публикация" : "Publishing")}</h2></header>
      {webhook ? <>
        {!snapshot.webhook.url && <p>{ru ? "Сначала сохраните подключение выключенным. После сохранения здесь появится Webhook URL для настройки сервиса." :
          "First save the connection with integration disabled. Its Webhook URL will appear here for service setup."}</p>}
        <p>{snapshot.connection?.enabled ? (ru ? "Falcon проверяет подпись входящих событий сохранённым секретом. Оставьте поле пустым, чтобы сохранить действующий секрет." :
          "Falcon verifies incoming event signatures with the stored secret. Leave the field empty to keep the current secret.") :
          provider === "linear" ? (ru ? "Создайте вебхук в Linear с этим URL и скопируйте выданный секрет подписи в поле ниже." :
          "Create a Linear webhook with this URL, then copy its generated signing secret into the field below.") :
          provider === "trello" ? (ru ? "Секрет приложения доступен в настройках Trello Power-Up до регистрации вебхука. Укажите его здесь и сохраните подключение выключенным. Затем зарегистрируйте вебхук выбранной доски с этим URL." :
            "The application secret is available in Trello Power-Up settings before webhook registration. Enter it here and save with integration disabled. Then register the selected board’s webhook with this URL.") :
            (ru ? "Создайте вебхук в сервисе с этим URL. Укажите один и тот же секрет подписи в сервисе и в поле ниже." :
              "Create a service webhook with this URL. Use the same signing secret in the service and in the field below.")}</p>
        {!snapshot.connection?.enabled && <small>{ru ? "После настройки вебхука включите интеграцию и сохраните изменения, чтобы запустить автоматизацию." :
          "After setting up the webhook, enable the integration and save changes to start automation."}</small>}
        <label>{provider === "trello" ? (ru ? "Секрет приложения Trello" : "Trello application secret") : (ru ? "Секрет подписи" : "Signing secret")}
          <input type="password" autoComplete="new-password" value={draft.secrets.signingSecret ?? ""}
            placeholder={snapshot.connection?.webhookConfigured ? "••••••••" : (ru ? "Не менее 32 символов" : "At least 32 characters")}
            onChange={(e) => { const secrets = { ...draft.secrets }; if (e.target.value) secrets.signingSecret = e.target.value;
              else delete secrets.signingSecret; onChange({ ...draft, secrets }); }} /></label>
        {snapshot.webhook.url ? <div className={styles.callback}><span>Webhook URL</span><code>{snapshot.webhook.url}</code>
          <button type="button" className={styles.secondary} onClick={() => { void navigator.clipboard.writeText(snapshot.webhook.url!).then(() => setCopied(true), () => setCopied(false)); }}>
            <Copy size={14} />{copied ? (ru ? "Скопировано" : "Copied") : (ru ? "Копировать" : "Copy")}</button></div> :
          <small>{ru ? "Для получения адреса сохраните подключение; секрет подписи можно добавить следующим шагом." :
            "Save the connection to get its URL; the signing secret can be added in the next step."}</small>}
        <a href={copy.docs} target="_blank" rel="noreferrer">{ru ? "Настроить вебхук в сервисе" : "Set up the service webhook"}<ExternalLink size={13} /></a>
      </> : <><p>{provider === "slack" ? (ru ? "Уведомления содержат доступные результаты и ссылку на прогон, дефект или исходное событие. Упоминания пользователей не разворачиваются." :
        "Notifications contain available results and a link to the run, defect or source event. User mentions are not expanded.") : (ru ? "Каждый завершённый прогон получает свою страницу под выбранной родительской страницей. Повторная доставка обновляет существующий отчёт." :
          "Each completed run gets a page under the selected parent. Redelivery updates the existing report.")}</p>
        <a href={copy.docs} target="_blank" rel="noreferrer">{ru ? "Права и настройка" : "Permissions and setup"}<ExternalLink size={13} /></a></>}
    </section>
  </div>;
}
