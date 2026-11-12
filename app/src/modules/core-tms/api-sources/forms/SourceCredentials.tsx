import { IntegrationInput } from "../../presentation/common/integration-controls/input/IntegrationInput";
import { IntegrationSelect } from "../../presentation/common/integration-controls/select/IntegrationSelect";
import { keepsSourceCredentials, type ApiSource, type ApiSourceDraft } from "../model/api-source";
import { SourceDisclosure } from "../editor/disclosure/SourceDisclosure";
import css from "../editor/editor.module.css";
export function SourceCredentials({ draft, source, ru, disabled = false, onChange }: { draft: ApiSourceDraft; source: ApiSource | null; ru: boolean; disabled?: boolean; onChange: (draft: ApiSourceDraft) => void }) {
  const stored = keepsSourceCredentials(source, draft);
  const secret = (key: "username" | "password" | "apiToken", value: string) => {
    const secrets = { ...draft.secrets }; if (value) secrets[key] = value; else delete secrets[key];
    onChange({ ...draft, secrets });
  };
  const options = [{ key: "none", label: ru ? "Без авторизации" : "No authentication" },
    { key: "basic", label: ru ? "Логин и пароль" : "Username and password" }, { key: "bearer", label: "Bearer token" }];
  return <SourceDisclosure title={ru ? "Доступ к спецификации" : "Specification access"}
    summary={options.find(option => option.key === draft.authMode)!.label} defaultOpen={draft.authMode !== "none"} disabled={disabled}>
    <div className={css.credentials}>
      <p>{ru ? "Используется Falcon для загрузки спецификации. Токен для выполнения запросов указывается отдельно в API Testing." : "Used by Falcon to load the specification. Request credentials are entered separately in API Testing."}</p>
      <IntegrationSelect aria-label={ru ? "Авторизация спецификации" : "Specification authentication"}
        isDisabled={disabled} value={draft.authMode} options={options.map(option => ({ value: option.key, label: option.label }))}
        onValueChange={mode => { if (mode === "none" || mode === "basic" || mode === "bearer") onChange({ ...draft, authMode: mode, secrets: {} }); }} />
      {draft.authMode === "basic" && <div className={css.pair}>
        <IntegrationInput label={ru ? "Логин" : "Username"} autoComplete="off" isDisabled={disabled}
          value={draft.secrets.username ?? ""} placeholder={stored ? (ru ? "Сохранён" : "Saved") : " "} onValueChange={value => secret("username", value)}/>
        <IntegrationInput label={ru ? "Пароль" : "Password"} type="password" autoComplete="new-password" isDisabled={disabled}
          value={draft.secrets.password ?? ""} placeholder={stored ? "••••••••" : " "} onValueChange={value => secret("password", value)}/>
      </div>}
      {draft.authMode === "bearer" && <IntegrationInput label="Bearer token" type="password" autoComplete="new-password" isDisabled={disabled}
        value={draft.secrets.apiToken ?? ""} placeholder={stored ? "••••••••" : " "} onValueChange={value => secret("apiToken", value)}/>}
      {stored && <small>{ru ? "Пустые поля сохранят текущие данные доступа." : "Leave fields empty to keep the saved credentials."}</small>}
    </div>
  </SourceDisclosure>;
}
