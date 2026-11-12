import type { ConnectionInput, Provider } from "../../model/connector-types";
import { providerCopy } from "../../localization/connector-copy";
import styles from "../styles/connector.module.css";
import { IntegrationInput } from "../../../presentation/common/integration-controls/input/IntegrationInput";
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
      <IntegrationInput label={ru ? "Адрес сайта" : "Site URL"} type="url" value={draft.settings.baseUrl} isDisabled={bound}
        placeholder="https://company.atlassian.net" onValueChange={(baseUrl) => onChange({ ...draft, settings: { ...draft.settings, baseUrl } })} />
      <IntegrationInput label={ru ? "Почта Atlassian" : "Atlassian email"} type="email" autoComplete="off"
        placeholder={stored ? (ru ? "Сохранена на сервере" : "Stored on server") : "name@company.com"}
        value={draft.secrets.email ?? ""} onValueChange={(value) => secret("email", value)} />
    </>}
    {provider === "trello" && <IntegrationInput label="API key" type="password" autoComplete="new-password"
      placeholder={stored ? "••••••••" : ""} value={draft.secrets.apiKey ?? ""} onValueChange={(value) => secret("apiKey", value)} />}
    <IntegrationInput label={provider === "slack" ? "Bot token" : provider === "linear" ? "API key" : "API token"}
      type="password" autoComplete="new-password" spellCheck="false" value={draft.secrets.apiToken ?? ""}
        placeholder={stored ? (ru ? "Ключ сохранён · введите для замены" : "Token stored · enter to replace") : ""}
        onValueChange={(value) => secret("apiToken", value)} />
    <IntegrationInput label={copy.remote} value={draft.settings.remoteId} isDisabled={bound} spellCheck="false"
      placeholder={provider === "github" ? "owner/repository" : provider === "jira" ? "PROJECT" : provider === "slack" ? "C…" : ""}
      onValueChange={(remoteId) => onChange({ ...draft, settings: { ...draft.settings, remoteId } })} />
    <small>{stored ? (ru ? "Пустые поля доступа сохраняют текущие ключи." : "Empty credential fields preserve stored values.") :
      (ru ? "Ключи хранятся в зашифрованном виде на сервере Falcon." : "Credentials are stored encrypted on the Falcon server.")}</small>
  </section>;
}
