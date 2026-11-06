import { ArrowLeft, ArrowUpRight, CircleHelp } from "lucide-react";
import type { useCompanyWizard } from "../model/useCompanyWizard";
import css from "../../startup.module.css";
export function CompanyIdentityStep({ wizard, ru, busy, error, onClose }: { wizard: ReturnType<typeof useCompanyWizard>; ru: boolean; busy: boolean; error?: string; onClose(): void }) {
  const { values, stage, change } = wizard;
  const nameStep = stage === "name";
  const valid = nameStep ? values.displayName.trim().length >= 2 : /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug) && values.slug.length >= 2;
  function next() { if (busy || !valid) return; if (nameStep) wizard.go("address"); else void wizard.reserve(); }
  return <form className={css.identity} onSubmit={event => { event.preventDefault(); next(); }}>
    <h1 id="startup-title">{nameStep ? (ru ? "Начнём с названия вашей компании" : "Let’s start with a name for your company") : (ru ? "Выберите адрес для вашей команды" : "A place for your team to call home")} <span className={css.help} tabIndex={0}><CircleHelp size={21} /><span role="tooltip">{nameStep ? (ru ? "Так название будет отображаться в Falcon. Его можно изменить позже." : "This name appears in Falcon. You can change it later.") : (ru ? "По этому адресу сотрудники смогут войти в компанию." : "Your team will use this address to sign in.")}</span></span></h1>
    <div className={css.largeField}>
      <label className={css.srOnly} htmlFor={nameStep ? "startup-name" : "startup-slug"}>{nameStep ? (ru ? "Название компании" : "Company name") : (ru ? "Адрес компании" : "Company address")}</label>
      <input id={nameStep ? "startup-name" : "startup-slug"} className={css.headlineInput} required minLength={2} maxLength={nameStep ? 100 : 48} disabled={busy} value={nameStep ? values.displayName : values.slug} autoComplete="off" autoCapitalize={nameStep ? "sentences" : "none"} spellCheck={nameStep} aria-invalid={!!error} aria-describedby="startup-field-help" placeholder={nameStep ? (ru ? "Название вашей компании" : "Enter your company name") : "your-team"} onChange={event => change(nameStep ? "displayName" : "slug", event.target.value)} />
      <p id="startup-field-help" className={error ? css.error : css.hint}>{error || (!nameStep && (ru ? "Латинские буквы, цифры и дефисы. Адрес должен быть уникальным." : "Use letters, numbers and hyphens. Your address must be unique."))}</p>
      <span className={css.addressPill}>{values.slug || "your-team"}-falcon.saturnusgo.com</span>
    </div>
    <footer className={css.actions}>
      <button type="button" className={css.previous} disabled={busy} onClick={() => nameStep ? onClose() : wizard.go("name")}><ArrowLeft size={17} />{nameStep ? (ru ? "К тарифам" : "Back to plans") : (ru ? "Назад" : "Previous")}</button>
      <button type="button" className={css.primary} data-wizard-next={nameStep ? "name" : "address"} disabled={busy || !valid} onClick={next}>{busy ? (ru ? "Сохраняем…" : "Saving…") : (ru ? "Продолжить" : "Continue")}</button>
    </footer>
    {!nameStep && <button type="button" className={css.subtleLink} disabled={busy} onClick={() => wizard.go("legal")}>{ru ? "Добавить юридические сведения" : "Add legal details"}<ArrowUpRight size={15} /><span>{ru ? "Необязательно" : "Optional"}</span></button>}
  </form>;
}
