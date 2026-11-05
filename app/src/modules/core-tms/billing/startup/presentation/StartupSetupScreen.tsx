import { useState } from "react";
import type { useStartupSetup } from "../application/useStartupSetup";
import type { BillingPlan, BillingAccount } from "../../domain/billing";
import css from "./startup.module.css";
type Props = { model: ReturnType<typeof useStartupSetup>; plan?: BillingPlan; quote?: BillingAccount["checkoutQuotes"][number];
  canCheckout: boolean; paymentsAvailable: boolean; busy: boolean; ru: boolean; onBack(): void; onCheckout(): Promise<void> };
export function StartupSetupScreen({ model, plan, quote, canCheckout, paymentsAvailable, busy, ru, onBack, onCheckout }: Props) {
  const setup = model.setup;
  const [edit, setEdit] = useState<{ displayName: string; slug: string; legalName: string; countryCode: string; taxId: string; address: string } | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const values = edit ?? { displayName: setup?.displayName ?? "", slug: setup?.slug ?? "", legalName: setup?.legalName ?? "", countryCode: setup?.countryCode ?? "", taxId: setup?.taxId ?? "", address: setup?.address ?? "" };
  const context = setup ? `${setup.id}:${setup.version}` : "";
  const changed = edit !== null;
  const locked = busy || model.busy || model.loading || model.canRetryCommand;
  const ready = setup?.status === "ready" && !changed;
  const money = (amount: number, currency: string) => new Intl.NumberFormat(ru ? "ru-RU" : "en-US", { style: "currency", currency }).format(amount / 100);
  const error = model.error?.code;
  const slugError = error && /SLUG|ADDRESS|HOSTNAME/.test(error);
  const nameError = error && /DISPLAY_NAME/.test(error);
  const fieldError = ru ? "Проверьте значение или выберите другой вариант." : "Check this value or choose another one.";
  const status = { reserved: ru ? "Адрес зарезервирован" : "Address reserved", provisioning: ru ? "Подготавливаем адрес…" : "Preparing address…",
    ready: ru ? "Адрес готов" : "Address ready", failed: ru ? "Адрес не удалось подготовить. Оплата не начата." : "Could not prepare the address. Checkout has not started.",
    expired: ru ? "Резерв истёк. Сохраните данные ещё раз." : "Reservation expired. Save your details again.", activated: ru ? "Компания активирована" : "Company activated" };
  function change(field: keyof typeof values, value: string) { setEdit({ ...values, [field]: value }); setConfirmed(null); }
  async function save() {
    const saved = await model.save({ displayName: values.displayName, slug: values.slug, ...Object.fromEntries(["legalName", "countryCode", "taxId", "address"].filter(key => values[key as keyof typeof values]).map(key => [key, values[key as keyof typeof values]])) });
    if (saved) setEdit(null); setConfirmed(null);
  }
  return <section className={css.screen} aria-busy={locked} aria-labelledby="startup-title">
    <button type="button" disabled={locked} onClick={onBack}>{ru ? "К тарифам" : "Back to plans"}</button>
    <h2 id="startup-title">{ru ? "Подготовьте компанию" : "Set up your company"}</h2>
    <p>{ru ? "Сохраните название и адрес. Личный доступ сохраняется до подтверждённой оплаты." : "Save a name and address. Your personal access stays available until payment is confirmed."}</p>
    {model.loading && <p role="status">{ru ? "Загружаем данные…" : "Loading setup…"}</p>}
    {error && <p role="alert">{slugError || nameError ? fieldError : ru ? "Действие не выполнено. Обновите данные или повторите попытку." : "The action could not be completed. Refresh or try again."}</p>}
    <form onSubmit={event => { event.preventDefault(); if (!locked) void save(); }}>
      <fieldset disabled={locked}>
        <label htmlFor="startup-name">{ru ? "Название команды или компании" : "Team or company name"}</label>
        <input id="startup-name" required minLength={2} maxLength={100} value={values.displayName} aria-invalid={!!nameError} aria-describedby={nameError ? "startup-name-error" : undefined} onChange={event => change("displayName", event.target.value)} />
        {nameError && <p id="startup-name-error">{fieldError}</p>}
        <label htmlFor="startup-slug">{ru ? "Адрес компании" : "Company address"}</label>
        <input id="startup-slug" required autoCapitalize="none" autoComplete="off" spellCheck={false} value={values.slug} aria-invalid={!!slugError} aria-describedby="startup-address-help" onChange={event => change("slug", event.target.value)} />
        <p id="startup-address-help">{slugError ? fieldError : `${values.slug || "…"}-falcon.saturnusgo.com`}</p>
        <details><summary>{ru ? "Юридические сведения (необязательно)" : "Legal details (optional)"}</summary>
          {(["legalName", "countryCode", "taxId", "address"] as const).map((key, index) => <label key={key} htmlFor={`startup-${key}`}>
            {(ru ? ["Юридическое название", "Код страны регистрации", "Регистрационный или налоговый номер", "Юридический адрес"] : ["Legal name", "Country of registration (code)", "Registration or tax number", "Legal address"])[index]}
            <input id={`startup-${key}`} value={values[key]} onChange={event => change(key, event.target.value)} />
          </label>)}
        </details>
        <button type="submit">{ru ? "Сохранить и подготовить адрес" : "Save and prepare address"}</button>
      </fieldset>
    </form>
    {setup && <div role="status" aria-live="polite"><strong>{status[setup.status]}</strong><p>{setup.hostname}</p>
      <p>{ru ? "Резерв до: " : "Reserved until: "}{new Date(setup.expiresAt).toLocaleString(ru ? "ru-RU" : "en-US")}</p></div>}
    {setup?.status === "failed" && <button type="button" disabled={locked} onClick={() => void model.retry()}>{ru ? "Повторить подготовку" : "Retry address setup"}</button>}
    <button type="button" disabled={locked} onClick={model.reload}>{ru ? "Обновить статус" : "Refresh status"}</button>
    {model.canRetryCommand && <button type="button" disabled={busy || model.busy} onClick={() => void model.retryCommand()}>{ru ? "Повторить то же действие" : "Retry the same action"}</button>}
    {ready && <div className={css.summary}>
      <h3>{ru ? "Перед оплатой" : "Before checkout"}</h3>
      {plan && <p>{ru ? `Человеческих мест: ${plan.seats}` : `Human seats: ${plan.seats}`}</p>}
      {quote && <p>{ru ? "Сейчас: " : "Due now: "}{money(quote.subtotal, quote.currency)}</p>}
      {plan && <p>{ru ? "Далее ежемесячно: " : "Then monthly: "}{money(plan.amount, plan.currency)}</p>}
      {quote?.periodEnd && <p>{ru ? "Следующее списание: " : "Next renewal: "}{new Date(quote.periodEnd).toLocaleDateString(ru ? "ru-RU" : "en-US")}</p>}
      <label><input type="checkbox" checked={confirmed === context} disabled={locked} onChange={event => setConfirmed(event.target.checked ? context : null)} />
        {ru ? "Все проекты этого пространства станут проектами компании. Подтверждаю преобразование всего пространства." : "All projects in this workspace will become company projects. I confirm conversion of the whole workspace."}</label>
      {!paymentsAvailable && <p>{ru ? "Оплата пока недоступна." : "Payments are not available yet."}</p>}
      <button type="button" disabled={locked || !canCheckout || !paymentsAvailable || confirmed !== context || !quote || !plan} onClick={() => { if (!locked && canCheckout && paymentsAvailable && confirmed === context && quote && plan) void onCheckout(); }}>{ru ? "Перейти к оплате" : "Continue to checkout"}</button>
    </div>}
  </section>;
}
