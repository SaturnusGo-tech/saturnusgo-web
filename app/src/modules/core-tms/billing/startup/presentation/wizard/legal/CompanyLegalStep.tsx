import { ArrowLeft } from "lucide-react";
import type { useCompanyWizard } from "../model/useCompanyWizard";
import css from "../../startup.module.css";
export function CompanyLegalStep({ wizard, ru, busy }: { wizard: ReturnType<typeof useCompanyWizard>; ru: boolean; busy: boolean }) {
  return <form onSubmit={event => { event.preventDefault(); wizard.go("address"); }}>
    <h1>{ru ? "Несколько сведений о компании" : "A few details about your company"}</h1>
    <p className={css.lead}>{ru ? "Все поля необязательные. Вы сможете заполнить их позже в настройках компании." : "Everything here is optional. You can add these details later in company settings."}</p>
    <fieldset className={css.legalFields} disabled={busy}>{(["legalName", "countryCode", "taxId", "address"] as const).map((key, index) => <label key={key} className={css.field}>
      <span>{(ru ? ["Юридическое название", "Код страны", "Налоговый номер", "Юридический адрес"] : ["Legal name", "Country code", "Tax number", "Registered address"])[index]}</span>
      <input value={wizard.values[key]} maxLength={key === "countryCode" ? 2 : 300} autoComplete="off" onChange={event => wizard.change(key, key === "countryCode" ? event.target.value.toUpperCase() : event.target.value)} />
    </label>)}</fieldset>
    <footer className={css.actions}><button type="button" className={css.previous} onClick={() => wizard.go("address")}><ArrowLeft size={17} />{ru ? "Назад" : "Previous"}</button><button className={css.primary} type="submit">{ru ? "Продолжить" : "Continue"}</button></footer>
  </form>;
}
