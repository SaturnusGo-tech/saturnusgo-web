import { keepsSourceCredentials, type ApiSource, type ApiSourceDraft } from "../model/api-source";
import { AnimatedSelect } from "../../presentation/common/select/AnimatedSelect";
import { ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import css from "../editor/editor.module.css";
export function SourceCredentials({ draft, source, ru, onChange }: { draft: ApiSourceDraft; source: ApiSource | null; ru: boolean; onChange: (draft: ApiSourceDraft) => void }) {
  const stored = keepsSourceCredentials(source, draft);
  const [open, setOpen] = useState(draft.authMode !== "none"), id = useId();
  const secret = (key: "username" | "password" | "apiToken", value: string) => {
    const secrets = { ...draft.secrets }; if (value) secrets[key] = value; else delete secrets[key];
    onChange({ ...draft, secrets });
  };
  const label = draft.authMode === "basic" ? (ru ? "Логин и пароль" : "Username and password") : draft.authMode === "bearer" ? "Bearer token" : (ru ? "Без авторизации" : "No authentication");
  return <section className={css.option}>
    <button type="button" className={css.optionTrigger} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      <span>{ru ? "Доступ к документации" : "Documentation access"}</span><span className={css.optionValue}>{label}<ChevronRight size={16} data-open={open || undefined}/></span>
    </button>
    {open && <div id={id} className={css.optionBody}>
    <div className={css.credentials}>
    <div className={css.field}><span>{ru ? "Авторизация" : "Authentication"}</span>
      <AnimatedSelect label={ru ? "Авторизация" : "Authentication"} value={draft.authMode}
        onChange={mode => onChange({ ...draft, authMode: mode as ApiSourceDraft["authMode"], secrets: {} })}
        options={[{ value: "none", label: ru ? "Без авторизации" : "No authentication" }, { value: "basic", label: ru ? "Логин и пароль" : "Username and password" }, { value: "bearer", label: "Bearer token" }]}/>
    </div>
    {draft.authMode === "basic" && <div className={css.pair}>
      <label className={css.field}>{ru ? "Логин" : "Username"}<input autoComplete="off" value={draft.secrets.username ?? ""} placeholder={stored ? (ru ? "Сохранён" : "Saved") : ""} onChange={event => secret("username", event.target.value)}/></label>
      <label className={css.field}>{ru ? "Пароль" : "Password"}<input type="password" autoComplete="new-password" value={draft.secrets.password ?? ""} placeholder={stored ? "••••••••" : ""} onChange={event => secret("password", event.target.value)}/></label>
    </div>}
    {draft.authMode === "bearer" && <label className={css.field}>Bearer token<input type="password" autoComplete="new-password" value={draft.secrets.apiToken ?? ""} placeholder={stored ? "••••••••" : ""} onChange={event => secret("apiToken", event.target.value)}/></label>}
    {stored && <small>{ru ? "Пустые поля сохранят текущие данные доступа." : "Leave fields empty to keep the saved credentials."}</small>}
    </div></div>}
  </section>;
}
