import type { ConnectionInput, Provider } from "../../model/connector-types";
import { providerCopy } from "../../localization/connector-copy";
import styles from "../styles/connector.module.css";
export function CredentialFields({ provider, ru, draft, stored, bound, onChange }: {
  provider: Provider; ru: boolean; draft: ConnectionInput; stored: boolean; bound: boolean;
  onChange: (value: ConnectionInput) => void;
}) {
  const copy = providerCopy(provider, ru);
  const secret = (key: keyof ConnectionInput["secrets"], value: string) => {
    const secrets = { ...draft.secrets }; if (value) secrets[key] = value; else delete secrets[key];
    onChange({ ...draft, secrets });
  };
  return <section className={styles.panel}>
    <header><span className={styles.step}>1</span><h2>{ru ? "Доступ к сервису" : "Service access"}</h2></header>
    <p>{copy.hint}</p>
    {["jira", "confluence"].includes(provider) && <>
      <label>{ru ? "Адрес сайта" : "Site URL"}<input type="url" value={draft.settings.baseUrl} disabled={bound}
        placeholder="https://company.atlassian.net" onChange={(e) => onChange({ ...draft, settings: { ...draft.settings, baseUrl: e.target.value } })} /></label>
      <label>{ru ? "Почта Atlassian" : "Atlassian email"}<input type="email" autoComplete="off"
        placeholder={stored ? (ru ? "Сохранена на сервере" : "Stored on server") : "name@company.com"}
        value={draft.secrets.email ?? ""} onChange={(e) => secret("email", e.target.value)} /></label>
    </>}
    {provider === "trello" && <label>API key<input type="password" autoComplete="new-password"
      placeholder={stored ? "••••••••" : ""} value={draft.secrets.apiKey ?? ""} onChange={(e) => secret("apiKey", e.target.value)} /></label>}
    <label>{provider === "slack" ? "Bot token" : provider === "linear" ? "API key" : "API token"}
      <input type="password" autoComplete="new-password" spellCheck={false} value={draft.secrets.apiToken ?? ""}
        placeholder={stored ? (ru ? "Ключ сохранён · введите для замены" : "Token stored · enter to replace") : ""}
        onChange={(e) => secret("apiToken", e.target.value)} /></label>
    <label>{copy.remote}<input value={draft.settings.remoteId} disabled={bound} spellCheck={false}
      placeholder={provider === "github" ? "owner/repository" : provider === "jira" ? "PROJECT" : provider === "slack" ? "C…" : ""}
      onChange={(e) => onChange({ ...draft, settings: { ...draft.settings, remoteId: e.target.value } })} /></label>
    <small>{stored ? (ru ? "Пустые поля доступа сохраняют текущие ключи." : "Empty credential fields preserve stored values.") :
      (ru ? "Ключи хранятся в зашифрованном виде на сервере Falcon." : "Credentials are stored encrypted on the Falcon server.")}</small>
  </section>;
}
