import { ArrowUpRight, CheckCircle2, FileJson2, ShieldCheck } from "lucide-react";
import type { ConnectionInput, Discovery, Snapshot } from "../../model/connector-types";
import { swaggerWorkspaceUrl } from "../../../presentation/api-testing/model";
import styles from "./swagger-connection.module.css";

export function SwaggerConnectionPanel({ ru, draft, snapshot, discovery, pending, onChange, onDiscover }: {
  ru: boolean; draft: ConnectionInput; snapshot: Snapshot; discovery: Discovery | null;
  pending: string | null; onChange: (value: ConnectionInput) => void; onDiscover: () => void;
}) {
  const mode = draft.settings.specAuthMode ?? "none";
  const stored = snapshot.connection?.credentialsConfigured && mode === snapshot.connection.settings.specAuthMode;
  const setMode = (specAuthMode: "none" | "basic" | "bearer") => onChange({ ...draft,
    settings: { ...draft.settings, specAuthMode }, secrets: {} });
  const secret = (key: "username" | "password" | "apiToken", value: string) => {
    const secrets = { ...draft.secrets };
    if (value) secrets[key] = value; else delete secrets[key];
    onChange({ ...draft, secrets });
  };
  return <div className={styles.root}>
    <section className={styles.fields} aria-labelledby="swagger-source-heading">
      <h2 id="swagger-source-heading"><FileJson2 size={18} />{ru ? "Источник спецификации" : "Specification source"}</h2>
      <label>{ru ? "URL спецификации OpenAPI" : "OpenAPI specification URL"}
        <input type="url" required autoComplete="off" spellCheck={false} maxLength={300}
          placeholder="https://api.company.com/openapi.json" value={draft.settings.baseUrl}
          readOnly={Boolean(snapshot.connection)} onChange={(event) => onChange({ ...draft,
            settings: { ...draft.settings, baseUrl: event.target.value } })} aria-describedby="swagger-url-hint" /></label>
      <p id="swagger-url-hint">{ru ? "Прямая ссылка на JSON или YAML, например /docs-json или /v3/api-docs. Поддерживаются OpenAPI 3.0, 3.1 и Swagger 2.0." :
        "A direct JSON or YAML URL, such as /docs-json or /v3/api-docs. Supports OpenAPI 3.0, 3.1 and Swagger 2.0."}</p>
      {snapshot.connection && <p>{ru ? "Чтобы сменить адрес, отсоедините текущее подключение ниже и укажите новый источник." : "To change the URL, disconnect below and configure the new source."}</p>}
      <label className={styles.toggle}><input type="checkbox" checked={mode !== "none"} onChange={(event) => setMode(event.target.checked ? "basic" : "none")} />
        <span>{ru ? "Для доступа к Swagger нужна авторизация" : "Swagger requires authentication"}</span></label>
      {mode !== "none" && <div className={styles.credentials}>
        <label>{ru ? "Способ авторизации" : "Authentication method"}<select value={mode} onChange={(event) => setMode(event.target.value as "basic" | "bearer")}>
          <option value="basic">{ru ? "Логин и пароль · HTTP Basic" : "Username and password · HTTP Basic"}</option><option value="bearer">Bearer token</option>
        </select></label>
        {mode === "basic" ? <>
          <label>{ru ? "Логин" : "Username"}<input autoComplete="off" value={draft.secrets.username ?? ""}
            placeholder={stored ? (ru ? "Сохранён" : "Stored") : ""} onChange={(event) => secret("username", event.target.value)} /></label>
          <label>{ru ? "Пароль" : "Password"}<input type="password" autoComplete="new-password" value={draft.secrets.password ?? ""}
            placeholder={stored ? "••••••••" : ""} onChange={(event) => secret("password", event.target.value)} /></label>
        </> : <label>Bearer token<input type="password" autoComplete="new-password" value={draft.secrets.apiToken ?? ""}
          placeholder={stored ? "••••••••" : ""} onChange={(event) => secret("apiToken", event.target.value)} /></label>}
        <p>{stored ? (ru ? "Данные сохранены в зашифрованном виде. Пустые поля сохраняют действующие значения." : "Credentials are encrypted. Empty fields keep the stored values.") :
          (ru ? "Используйте отдельную учётную запись с доступом только к документации." : "Use a dedicated account with documentation access only.")}</p>
      </div>}
      {mode === "none" && <p>{ru ? "Публичная спецификация загружается без логина, пароля и токена. При сохранении прежние данные доступа будут удалены." :
        "Public specifications load without credentials. Saving this mode removes any previously stored credentials."}</p>}
      <button type="button" className={styles.verify} disabled={Boolean(pending) || !draft.settings.baseUrl} onClick={onDiscover}>
        <ShieldCheck size={16} />{pending === "discover" ? (ru ? "Проверяем…" : "Checking…") : (ru ? "Проверить подключение" : "Test connection")}</button>
      {discovery && <div className={styles.verified} role="status"><CheckCircle2 size={18} /><div><strong>{discovery.account}</strong>
        {discovery.resources.map((item) => <p key={item.id}>{item.name}</p>)}</div></div>}
      {snapshot.connection?.checkedAt && <p>{ru ? "Проверено: " : "Verified: "}{new Date(snapshot.connection.checkedAt).toLocaleString(ru ? "ru-RU" : "en-US")}</p>}
    </section>
    <aside className={styles.guide}><h3>{ru ? "После подключения" : "Once connected"}</h3>
      <p>{ru ? "Сохраните подключение включённым и откройте API Testing. Спецификация доступна участникам выбранного проекта с правом просмотра интеграций." :
        "Save the enabled connection and open API Testing. The specification is available in this project to members with integration read access."}</p>
      <p>{ru ? "Authorize внутри Swagger управляет доступом к самому API. Логин и пароль из этой формы используются только для чтения документации." :
        "Authorize in Swagger controls access to the API itself. These credentials are used only to read the documentation."}</p>
      <p>{ru ? "Укажите конечный HTTPS-адрес без редиректов. Для многофайлового OpenAPI опубликуйте объединённую спецификацию." :
        "Use a final HTTPS URL without redirects. Publish a bundled specification for multi-file OpenAPI definitions."}</p>
      {snapshot.connection?.enabled && <a href={swaggerWorkspaceUrl(window.location.href, "api")}>
        {ru ? "Открыть API Testing" : "Open API Testing"}<ArrowUpRight size={15} /></a>}
    </aside>
  </div>;
}
