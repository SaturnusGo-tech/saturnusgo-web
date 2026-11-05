import { useState, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronRight, Globe2, LoaderCircle, RotateCw } from "lucide-react";
import type { useStartupSetup } from "../application/useStartupSetup";
import type { BillingPlan, BillingAccount } from "../../domain/billing";
import css from "./startup.module.css";
type Props = { model: ReturnType<typeof useStartupSetup>; plan?: BillingPlan; quote?: BillingAccount["checkoutQuotes"][number];
  canCheckout: boolean; paymentsAvailable: boolean; busy: boolean; ru: boolean; controlledTest?: boolean; checkoutNotice?: ReactNode; onBack(): void; onCheckout(): Promise<void> };
export function StartupSetupScreen({ model, plan, quote, canCheckout, paymentsAvailable, busy, ru, controlledTest = false, checkoutNotice, onBack, onCheckout }: Props) {
  const setup = model.setup;
  const [edit, setEdit] = useState<{ displayName: string; slug: string; legalName: string; countryCode: string; taxId: string; address: string } | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [legalOpen, setLegalOpen] = useState(false);
  const values = edit ?? { displayName: setup?.displayName ?? "", slug: setup?.slug ?? "", legalName: setup?.legalName ?? "", countryCode: setup?.countryCode ?? "", taxId: setup?.taxId ?? "", address: setup?.address ?? "" };
  const context = setup ? `${setup.id}:${setup.version}` : "";
  const changed = edit !== null;
  const locked = busy || model.busy || model.loading || model.canRetryCommand;
  const ready = setup?.status === "ready" && !changed;
  const preparing = setup?.status === "reserved" || setup?.status === "provisioning";
  const money = (amount: number, currency: string) => new Intl.NumberFormat(ru ? "ru-RU" : "en-US", { style: "currency", currency }).format(amount / 100);
  const error = model.error?.code;
  const slugError = error && /SLUG|ADDRESS|HOSTNAME/.test(error);
  const nameError = error && /DISPLAY_NAME/.test(error);
  const fieldError = ru ? "Проверьте значение или выберите другой вариант." : "Check this value or choose another one.";
  const status = { reserved: ru ? "Адрес зарезервирован" : "Address reserved", provisioning: ru ? "Подготавливаем адрес…" : "Preparing address…",
    ready: ru ? "Адрес готов" : "Address ready", failed: ru ? "Не удалось подготовить адрес" : "Could not prepare the address",
    expired: ru ? "Резерв истёк. Сохраните данные ещё раз." : "Reservation expired. Save your details again.", activated: ru ? "Компания активирована" : "Company activated" };
  function change(field: keyof typeof values, value: string) { setEdit({ ...values, [field]: value }); setConfirmed(null); }
  async function save() {
    const saved = await model.save({ displayName: values.displayName, slug: values.slug, ...Object.fromEntries(["legalName", "countryCode", "taxId", "address"].filter(key => values[key as keyof typeof values]).map(key => [key, values[key as keyof typeof values]])) });
    if (saved) setEdit(null); setConfirmed(null);
  }
  return <section className={css.screen} aria-busy={locked} aria-labelledby="startup-title">
    <nav className={css.navigation} aria-label={ru ? "Подключение компании" : "Company setup"}>
      <button type="button" className={css.back} disabled={locked} onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />{ru ? "К тарифам" : "Back to plans"}</button>
      <span>Startup <span aria-hidden="true">/</span> {ru ? "Компания" : "Company"}</span>
    </nav>
    <header className={css.heading}>
      <h2 id="startup-title">{ru ? "Создайте свою компанию" : "Set up your company"}</h2>
      <p>{ru ? "Общее пространство для вашей команды. Начните с названия и адреса." : "A shared workspace for your team. Start with a name and address."}</p>
    </header>
    {model.loading && <p className={css.loading} role="status"><LoaderCircle size={15} className={css.spin} aria-hidden="true" />{ru ? "Загружаем данные…" : "Loading setup…"}</p>}
    {error && !slugError && !nameError && <p className={css.error} role="alert">{ru ? "Действие не выполнено. Обновите данные или повторите попытку." : "The action could not be completed. Refresh or try again."}</p>}
    {error && !setup && !model.canRetryCommand && <button type="button" className={css.textButton} disabled={locked} onClick={model.reload}>{ru ? "Обновить данные" : "Refresh details"}</button>}
    <form className={css.form} onSubmit={event => { event.preventDefault(); if (!locked) void save(); }}>
      <fieldset className={css.fields} disabled={locked}>
        <div className={css.field}>
          <label htmlFor="startup-name">{ru ? "Название компании" : "Company name"}</label>
          <input className={css.input} id="startup-name" required minLength={2} maxLength={100} placeholder={ru ? "Название вашей команды" : "Your team’s name"} value={values.displayName} aria-invalid={!!nameError} aria-describedby={nameError ? "startup-name-error" : undefined} onChange={event => change("displayName", event.target.value)} />
          {nameError && <p className={css.error} id="startup-name-error" role="alert">{fieldError}</p>}
        </div>
        <div className={css.field}>
          <label htmlFor="startup-slug">{ru ? "Адрес в Falcon" : "Falcon address"}</label>
          <div className={css.address} data-invalid={!!slugError}>
            <Globe2 size={16} aria-hidden="true" />
            <input id="startup-slug" required placeholder="your-team" autoCapitalize="none" autoComplete="off" spellCheck={false} value={values.slug} aria-invalid={!!slugError} aria-describedby="startup-address-suffix startup-address-help" onChange={event => change("slug", event.target.value)} />
            <span id="startup-address-suffix">-falcon.saturnusgo.com</span>
          </div>
          <p className={slugError ? css.error : css.hint} id="startup-address-help" role={slugError ? "alert" : undefined}>{slugError ? fieldError : ru ? "Отдельный адрес для входа вашей команды." : "Your team’s own address to sign in."}</p>
          {setup && !changed && <div className={css.addressStatus}>
            <div role="status" aria-live="polite" className={css.status} data-status={setup.status}>
              {ready || setup.status === "activated" ? <Check size={15} aria-hidden="true" /> : preparing ? <LoaderCircle size={15} className={css.spin} aria-hidden="true" /> : null}
              <span>{status[setup.status]}</span><span className={css.srOnly}>{setup.hostname}</span>
            </div>
            <button type="button" className={css.refresh} disabled={locked} onClick={model.reload} aria-label={ru ? "Обновить статус" : "Refresh status"} title={ru ? "Обновить статус" : "Refresh status"}><RotateCw size={15} aria-hidden="true" /></button>
          </div>}
          {setup?.status === "failed" && !changed && <button type="button" className={css.textButton} disabled={locked} onClick={() => void model.retry()}>{ru ? "Повторить подготовку" : "Retry address setup"}</button>}
        </div>
        <div className={css.legal}>
          <button type="button" className={css.disclosure} aria-expanded={legalOpen} aria-controls="startup-legal" onClick={() => setLegalOpen(!legalOpen)}>
            <ChevronRight size={16} aria-hidden="true" /><span>{ru ? "Юридические сведения" : "Legal details"}</span><small>{ru ? "Необязательно" : "Optional"}</small>
          </button>
          <div className={css.disclosureBody} data-open={legalOpen} aria-hidden={!legalOpen} id="startup-legal">
            <div><fieldset className={css.legalFields} disabled={locked || !legalOpen}>
              {(["legalName", "countryCode", "taxId", "address"] as const).map((key, index) => <div className={css.field} key={key} data-wide={key === "legalName" || key === "address"}>
                <label htmlFor={`startup-${key}`}>{(ru ? ["Юридическое название", "Код страны", "Налоговый номер", "Юридический адрес"] : ["Legal name", "Country code", "Tax number", "Registered address"])[index]}</label>
                <input className={css.input} id={`startup-${key}`} value={values[key]} onChange={event => change(key, event.target.value)} />
              </div>)}
            </fieldset></div>
          </div>
        </div>
        {!ready && <div className={css.actions}><button className={css.primary} type="submit">{model.busy ? (ru ? "Сохраняем…" : "Saving…") : ru ? "Сохранить и продолжить" : "Save and continue"}</button></div>}
      </fieldset>
    </form>
    {model.canRetryCommand && <button type="button" className={css.textButton} disabled={busy || model.busy} onClick={() => void model.retryCommand()}>{ru ? "Повторить то же действие" : "Retry the same action"}</button>}
    {ready && <section className={css.summary} aria-labelledby="startup-plan-title">
      <div className={css.plan}>
        <div><h3 id="startup-plan-title">Startup</h3>{plan && <p>{ru ? `${plan.seats} мест в команде` : `${plan.seats} team members`}</p>}</div>
        {plan && <div className={css.price}><strong>{money(plan.amount, plan.currency)}</strong><span>{ru ? "в месяц" : "per month"}</span></div>}
      </div>
      <dl className={css.totals}>
        {quote && <div><dt>{ru ? "К оплате сейчас" : "Due now"}</dt><dd>{money(quote.subtotal, quote.currency)}</dd></div>}
        {quote?.periodEnd && <div><dt>{ru ? "Следующее продление" : "Next renewal"}</dt><dd>{new Date(quote.periodEnd).toLocaleDateString(ru ? "ru-RU" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</dd></div>}
      </dl>
      <label className={css.consent}><input type="checkbox" checked={confirmed === context} disabled={locked} onChange={event => setConfirmed(event.target.checked ? context : null)} />
        <span>{ru ? "Все проекты этого пространства станут проектами компании. Подтверждаю преобразование всего пространства." : "All projects in this workspace will become company projects. I confirm conversion of the whole workspace."}</span></label>
      {!paymentsAvailable && <p className={css.hint}>{ru ? "Оплата пока недоступна." : "Payments are not available yet."}</p>}
      <div className={css.actions}><button className={css.primary} type="button" disabled={locked || !canCheckout || !paymentsAvailable || confirmed !== context || !quote || !plan} onClick={() => { if (!locked && canCheckout && paymentsAvailable && confirmed === context && quote && plan) void onCheckout(); }}>{ru ? "Перейти к оплате" : "Continue to checkout"}</button></div>
    </section>}
    {checkoutNotice && <div className={css.checkoutNotice}>{checkoutNotice}</div>}
    {controlledTest && <p className={css.testNotice} role="status">{ru ? "Тестовый режим · без списаний" : "Test mode · no charge"}</p>}
  </section>;
}
