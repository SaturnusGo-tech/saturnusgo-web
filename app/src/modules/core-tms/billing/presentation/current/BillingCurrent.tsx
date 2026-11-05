import type { BillingAccount, BillingSummary } from "../../domain/billing";
import css from "../screen/billing.module.css";

type Props = { summary: BillingSummary; account: BillingAccount | null; ru: boolean; busy: boolean; canManage: boolean;
  onCancel(): void; onResume(): void; onRetry(): void };
const names = { individual: "Individual", startup: "Startup", enterprise: "Enterprise" };
export function BillingCurrent({ summary, account, ru, busy, canManage, onCancel, onResume, onRetry }: Props) {
  const sub = account?.subscription;
  const planId = sub?.planId ?? summary.planId;
  const date = (value: string) => new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  const labels = ru ? { active: "Активна", past_due: "Платёж не прошёл", canceled: "Завершена", legacy: "Без подписки", unsubscribed: "Без подписки" }
    : { active: "Active", past_due: "Payment overdue", canceled: "Ended", legacy: "No subscription", unsubscribed: "No subscription" };
  return <section className={css.current} aria-labelledby="billing-current-title">
    <div className={css.currentHeading}><strong id="billing-current-title">{planId ? names[planId] : (ru ? "Подписка не выбрана" : "No plan selected")}</strong>
      <span className={css.status}>{sub?.cancelAtPeriodEnd && sub.status !== "canceled" ? (ru ? "Продление отключено" : "Renewal off") : labels[sub?.status ?? summary.status]}</span></div>
    {!sub && !planId && <p className={css.muted}>{summary.status === "legacy"
      ? (ru ? "Текущие места и доступ компании сохраняются. Подписка начнётся только после подтверждения подключения." : "Your company keeps its existing seats and access. A subscription starts only when you confirm checkout.")
      : (ru ? "Пробный период личного пространства действует независимо от выбора подписки." : "Your personal workspace trial is separate from subscribing.")}</p>}
    {sub && <dl className={css.facts}>
      <div><dt>{ru ? "Места" : "Seats"}</dt><dd>{account.occupiedSeats} / {sub.seats}</dd></div>
      <div><dt>{ru ? "В месяц, без налогов" : "Monthly, excluding tax"}</dt><dd>{new Intl.NumberFormat(ru ? "ru-RU" : "en-US", { style: "currency", currency: sub.currency }).format(sub.amount / 100)}</dd></div>
      <div><dt>{sub.status === "canceled" ? (ru ? "Подписка завершилась" : "Subscription ended") : sub.cancelAtPeriodEnd ? (ru ? "Доступ до" : "Access until") : (ru ? "Следующее продление" : "Next renewal")}</dt><dd>{date(sub.periodEnd)}</dd></div>
      {sub.pendingPlanId && <div><dt>{ru ? "Следующий тариф" : "Next plan"}</dt><dd>{names[sub.pendingPlanId]} · {date(sub.periodEnd)}</dd></div>}
      {sub.graceUntil && <div><dt>{ru ? "Льготный доступ до" : "Grace access until"}</dt><dd>{date(sub.graceUntil)}</dd></div>}
    </dl>}
    {sub?.status === "past_due" && <p className={css.note}>{ru ? "Не удалось продлить подписку. Проверьте способ оплаты и повторите платёж." : "The renewal payment failed. Check your payment method and retry."}</p>}
    {canManage && sub && sub.status !== "canceled" && <div className={css.actions}>
      {sub.status === "past_due" && <button type="button" className={css.primary} disabled={busy} onClick={onRetry}>{ru ? "Повторить платёж" : "Retry payment"}</button>}
      {sub.cancelAtPeriodEnd ? <button type="button" className={css.secondary} disabled={busy} onClick={onResume}>{ru ? "Включить продление" : "Resume renewal"}</button>
        : <button type="button" className={css.secondary} disabled={busy} onClick={onCancel}>{ru ? "Отключить продление" : "Cancel renewal"}</button>}
    </div>}
    {!canManage && <p className={css.note}>{ru ? "Подпиской и счетами управляет администратор рабочего пространства." : "Your workspace administrator manages the subscription and invoices."}</p>}
    {!sub && account && <p className={css.note}>{ru ? `Сейчас занято мест: ${account.occupiedSeats}.` : `Currently occupied seats: ${account.occupiedSeats}.`}</p>}
  </section>;
}
