import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { BillingCheckout, BillingOutcome, BillingPlan } from "../../../../domain/billing";
import css from "../../startup.module.css";
export function CompanyCheckoutStep({ checkout, plan, ru, busy, available, controlledTest, onConfirm }: { checkout: BillingCheckout; plan?: BillingPlan; ru: boolean; busy: boolean; available: boolean; controlledTest: boolean; onConfirm(outcome: BillingOutcome): void }) {
  const [outcome, setOutcome] = useState<BillingOutcome>("success");
  const money = (value: number, currency: string) => new Intl.NumberFormat(ru ? "ru-RU" : "en-US", { style: "currency", currency }).format(value / 100);
  const validQuote = Number.isFinite(checkout.subtotal) && !!checkout.currency;
  const canConfirm = available && checkout.testMode && controlledTest && validQuote && !busy;
  return <div>
    <h1>{ru ? "Всё готово к следующему шагу" : "You’re ready for the next chapter"}</h1>
    <p className={css.lead}>{ru ? "Проверьте подписку перед активацией компании." : "Review your subscription before activating your company."}</p>
    <dl className={css.checkoutTotals}><div><dt>{ru ? "Тариф" : "Plan"}</dt><dd>Startup{plan ? ` · ${plan.seats} ${ru ? "мест" : "seats"}` : ""}</dd></div><div><dt>{ru ? "К оплате сейчас, без налогов" : "Due now, before tax"}</dt><dd>{validQuote ? money(checkout.subtotal, checkout.currency) : "—"}</dd></div>{plan && <div><dt>{ru ? "Далее ежемесячно, без налогов" : "Then monthly, before tax"}</dt><dd>{money(plan.amount, plan.currency)}</dd></div>}{checkout.periodEnd && <div><dt>{ru ? "Следующее продление" : "Next renewal"}</dt><dd>{new Date(checkout.periodEnd).toLocaleDateString(ru ? "ru-RU" : "en-US")}</dd></div>}</dl>
    {controlledTest && <><p className={css.testNotice}>{ru ? "Тестовый режим · без списаний" : "Test mode · no charge"}</p><p className={css.hint}>{ru ? "Карта не требуется. Подтверждение включит тестовую подписку с имитацией ежемесячного продления." : "No card is required. Confirmation enables a test subscription with simulated monthly renewal."}</p><fieldset className={css.outcomes} disabled={busy}><legend>{ru ? "Результат теста" : "Test result"}</legend>{(["success", "declined"] as const).map(value => <label key={value}><input type="radio" name="billing-outcome" checked={outcome === value} onChange={() => setOutcome(value)} />{value === "success" ? (ru ? "Успешно" : "Success") : (ru ? "Отклонено" : "Declined")}</label>)}</fieldset></>}
    <footer className={css.actions}><button type="button" className={css.previous} disabled={!canConfirm} onClick={() => { if (canConfirm) onConfirm("declined"); }}><ArrowLeft size={17} />{ru ? "Отменить" : "Cancel"}</button><button type="button" className={css.primary} disabled={!canConfirm} onClick={() => { if (canConfirm) onConfirm(outcome); }}>{ru ? "Подтвердить" : "Confirm"}</button></footer>
  </div>;
}
