import { useState } from "react";
import type { BillingCheckout, BillingOutcome, BillingPlan, BillingPlanId, BillingSubscription } from "../../domain/billing";
import css from "../screen/billing.module.css";

export type BillingConfirmationIntent = { kind: "plan"; planId: BillingPlanId } | { kind: "cancel" | "resume" | "retry" };
type Props = { intent: BillingConfirmationIntent | null; checkout: BillingCheckout | null; plans: readonly BillingPlan[];
  current: BillingSubscription | null; testMode: boolean; busy: boolean; ru: boolean;
  onConfirm(intent: BillingConfirmationIntent): void; onCheckout(outcome: BillingOutcome): void; onDismiss(): void };
const names = { individual: "Individual", startup: "Startup", enterprise: "Enterprise" };
export function BillingConfirmation({ intent, checkout, plans, current, testMode, busy, ru, onConfirm, onCheckout, onDismiss }: Props) {
  const [outcome, setOutcome] = useState<BillingOutcome>("success");
  const open = checkout?.status === "open";
  if (!intent && !open) return null;
  const planId = open ? checkout.planId : intent?.kind === "plan" ? intent.planId : null;
  const plan = plans.find(row => row.id === planId);
  const quoteAvailable = open && Number.isFinite(checkout.subtotal) && Boolean(checkout.currency);
  const money = (amount: number, currency: string) => new Intl.NumberFormat(ru ? "ru-RU" : "en-US", { style: "currency", currency }).format(amount / 100);
  const date = (value: string) => new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", { dateStyle: "medium" }).format(new Date(value));
  const title = open ? checkout.prorated ? (ru ? "Тестовый переход" : "Test upgrade") : (ru ? "Тестовое подключение" : "Test checkout") : intent?.kind === "cancel" ? (ru ? "Отключить автопродление?" : "Cancel automatic renewal?")
    : intent?.kind === "resume" ? (ru ? "Включить автопродление?" : "Resume automatic renewal?") : intent?.kind === "retry" ? (ru ? "Повторить платёж?" : "Retry payment?") : (ru ? "Изменить тариф?" : "Change plan?");
  return <section className={css.confirmation} role="region" aria-labelledby="billing-confirm-title">
    <h3 id="billing-confirm-title">{title}</h3>
    {open ? <>
      <p>{names[checkout.planId]}</p>
      {quoteAvailable ? <dl className={css.facts}>
        <div><dt>{ru ? "Сейчас, без налогов" : "Due now, before tax"}</dt><dd>{money(checkout.subtotal, checkout.currency)}</dd></div>
        {plan && <div><dt>{ru ? "Далее ежемесячно" : "Then monthly"}</dt><dd>{money(plan.amount, plan.currency)}</dd></div>}
        {checkout.periodEnd && <div><dt>{ru ? "Дата продления" : "Renewal date"}</dt><dd>{date(checkout.periodEnd)}</dd></div>}
      </dl> : <p className={css.note} role="alert">{ru ? "Сумма подключения недоступна. Закройте это окно и выберите тариф ещё раз." : "The checkout amount is unavailable. Close this checkout and choose the plan again."}</p>}
      {checkout.prorated && <p className={css.note}>{ru ? `Сумма рассчитана за остаток оплаченного периода. После успешного подтверждения включится ${names[checkout.planId]}; дата продления останется прежней.` : `This amount covers the remaining paid period. Successful confirmation starts ${names[checkout.planId]} and keeps your existing renewal date.`}</p>}
    </> : plan && <p>{names[plan.id]} · {money(plan.amount, plan.currency)} {ru ? "в месяц, плюс применимые налоги" : "per month, plus applicable tax"}</p>}
    <p className={css.note}>{open ? (ru ? "Это проверка биллинга. Деньги не списываются, карта не требуется. При успешном подключении включится ежемесячное тестовое продление." : "This tests billing. No money is charged and no card is required. A successful checkout enables simulated monthly renewal.")
      : intent?.kind === "cancel" ? (ru ? "Доступ сохранится до конца оплаченного периода. Новых списаний не будет." : "Access stays available through the paid period. No further renewals will be charged.")
      : intent?.kind === "resume" ? (ru ? "Подписка продолжит продлеваться каждый месяц по текущему тарифу." : "Your subscription will renew monthly on the current plan.")
      : intent?.kind === "retry" ? (ru ? "Проверим платёж за текущий период. В тестовом режиме реального списания нет." : "Retry the payment for the current period. Test mode does not charge money.")
      : (ru ? "Новый тариф начнёт действовать со следующего продления. Текущий период останется без изменений." : "The new plan starts at the next renewal. The current billing period stays unchanged.")}</p>
    {current && intent?.kind === "plan" && <p className={css.note}>{ru ? "Дата изменения: " : "Effective date: "}{date(current.periodEnd)}</p>}
    {open && testMode && <fieldset disabled={busy}><legend>{ru ? "Результат тестового платежа" : "Simulated payment result"}</legend>
      {(["success", "declined"] as const).map(value => <label key={value}><input type="radio" name="billing-outcome" value={value} checked={outcome === value} onChange={() => setOutcome(value)} />{value === "success" ? (ru ? "Успешно" : "Successful") : (ru ? "Отклонён" : "Declined")}</label>)}
    </fieldset>}
    <div className={css.actions}>
      <button type="button" className={css.primary} disabled={busy || (open && (!testMode || !quoteAvailable))} onClick={() => open ? onCheckout(outcome) : intent && onConfirm(intent)}>{busy ? (ru ? "Обрабатываем…" : "Processing…") : (ru ? "Подтвердить" : "Confirm")}</button>
      <button type="button" className={css.secondary} disabled={busy} onClick={() => open ? onCheckout("declined") : onDismiss()}>{ru ? "Отмена" : "Cancel"}</button>
    </div>
  </section>;
}
