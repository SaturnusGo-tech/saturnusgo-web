import { keepsSourceCredentials, type ApiSource, type ApiSourceDraft } from "../model/api-source";
import { AnimatedSelect } from "../../presentation/common/select/AnimatedSelect";
import css from "../editor/editor.module.css";
export function SourceCredentials({ draft, source, ru, onChange }: { draft: ApiSourceDraft; source: ApiSource | null; ru: boolean; onChange: (draft: ApiSourceDraft) => void }) {
  const stored = keepsSourceCredentials(source, draft);
  const secret = (key: "username" | "password" | "apiToken", value: string) => {
    const secrets = { ...draft.secrets }; if (value) secrets[key] = value; else delete secrets[key];
    onChange({ ...draft, secrets });
  };
  return <div className={css.credentials}>
    <div className={css.field}><span>{ru ? "Доступ к документации" : "Documentation access"}</span>
      <AnimatedSelect label={ru ? "Доступ к документации" : "Documentation access"} value={draft.authMode}
        onChange={mode => onChange({ ...draft, authMode: mode as ApiSourceDraft["authMode"], secrets: {} })}
        options={[{ value: "none", label: ru ? "Без авторизации" : "No authentication" }, { value: "basic", label: ru ? "Логин и пароль" : "Username and password" }, { value: "bearer", label: "Bearer token" }]}/>
    </div>
    {draft.authMode === "basic" && <div className={css.pair}>
      <label className={css.field}>{ru ? "Логин" : "Username"}<input autoComplete="off" value={draft.secrets.username ?? ""} placeholder={stored ? (ru ? "Сохранён" : "Saved") : ""} onChange={event => secret("username", event.target.value)}/></label>
      <label className={css.field}>{ru ? "Пароль" : "Password"}<input type="password" autoComplete="new-password" value={draft.secrets.password ?? ""} placeholder={stored ? "••••••••" : ""} onChange={event => secret("password", event.target.value)}/></label>
    </div>}
    {draft.authMode === "bearer" && <label className={css.field}>Bearer token<input type="password" autoComplete="new-password" value={draft.secrets.apiToken ?? ""} placeholder={stored ? "••••••••" : ""} onChange={event => secret("apiToken", event.target.value)}/></label>}
    {stored && <small>{ru ? "Пустые поля сохранят текущие данные доступа." : "Leave fields empty to keep the saved credentials."}</small>}
  </div>;
}
