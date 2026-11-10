import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CreditCard } from "lucide-react";
import type { BillingAccount, BillingCheckout, BillingCheckoutMode, BillingFailure, BillingInvoice, BillingOutcome, BillingPlanId, BillingSummary } from "../../domain/billing";
import { BillingCurrent } from "../current/BillingCurrent";
import { BillingPlans } from "../plans/BillingPlans";
import { BillingConfirmation, type BillingConfirmationIntent } from "../confirmation/BillingConfirmation";
import { billingPaymentsAvailable } from "../../domain/catalog/billing-availability";
import css from "./billing.module.css";

type Props = {
  summary: BillingSummary | null; account: BillingAccount | null; checkout: BillingCheckout | null; invoices: readonly BillingInvoice[];
  loading: boolean; busy: boolean; error: BillingFailure | null; invoicesError: BillingFailure | null;
  canManage: boolean; canRetryCommand: boolean; hasMoreInvoices: boolean; loadingMoreInvoices: boolean; ru: boolean;
  reload(): void; loadMoreInvoices(): Promise<void>; retryCommand(): Promise<void>; startCheckout(id: BillingPlanId): Promise<void>;
  confirmCheckout(outcome: BillingOutcome): Promise<void>; changePlan(id: BillingPlanId): Promise<void>;
  cancel(): Promise<void>; resume(): Promise<void>; retryPayment(): Promise<void>;
  paymentsAvailable?: boolean; checkoutMode?: BillingCheckoutMode; identityConfirmation?: ReactNode; onStartupSetup?(): void; onClose?(): void;
};
function failureText(code: string, ru: boolean) {
  switch (code) {
    case "BILLING_FORBIDDEN": return ru ? "У вас нет доступа к управлению подпиской." : "You do not have permission to manage billing.";
    case "BILLING_READ_ONLY": return ru ? "Изменения подписки сейчас недоступны." : "Subscription changes are currently unavailable.";
    case "BILLING_CONTACT_SALES": return ru ? "Enterprise подключается через поддержку. Обсудим состав команды и условия." : "Contact support to arrange Enterprise for your team.";
    case "BILLING_TEAM_UNAVAILABLE": return ru ? "Не удалось подготовить управление командой. Оплата не выполнена; попробуйте позже." : "Team administration could not be prepared. No payment was collected; please try again later.";
    case "BILLING_SEATS_OCCUPIED": return ru ? "На этом тарифе недостаточно мест для текущей команды." : "This plan does not have enough seats for your team.";
    case "BILLING_PLAN_INCOMPATIBLE": return ru ? "Тариф не подходит этому типу рабочего пространства." : "This plan is not available for this workspace type.";
    case "BILLING_CHECKOUT_EXPIRED": return ru ? "Время подключения истекло. Выберите тариф ещё раз." : "The checkout expired. Choose your plan again.";
    case "BILLING_VERSION_CONFLICT": return ru ? "Подписка изменилась. Мы обновили её данные; проверьте их перед повтором." : "The subscription changed. Review its refreshed details before trying again.";
    case "BILLING_CONFLICT": return ru ? "У подписки уже есть незавершённое действие. Обновите данные." : "There is already a pending billing action. Refresh the details.";
    case "BILLING_INVALID_STATE": return ru ? "Действие недоступно для текущего состояния подписки. Обновите данные." : "This action is not available for the current subscription state. Refresh the details.";
    default: return ru ? "Не удалось загрузить или изменить подписку. Попробуйте ещё раз." : "Could not load or update billing. Please try again.";
  }
}
export function BillingScreen(props: Props) {
  const { ru, summary, account, checkout, error, busy, loading, canManage } = props;
  const [intent, setIntent] = useState<BillingConfirmationIntent | null>(null);
  const confirmationStage = useRef<HTMLDivElement>(null), offerStage = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null), wasConfirming = useRef(false);
  const locked = busy || props.canRetryCommand;
  const controlledTest = props.checkoutMode === "controlled_test";
  const openCheckout = checkout?.status === "open";
  const confirming = Boolean(intent) || openCheckout;
  const identityRequired = Boolean(props.identityConfirmation);
  const subscription = account?.subscription;
  const recovery = subscription && subscription.status !== "canceled" ? subscription.status === "past_due" ? "retry" : subscription.cancelAtPeriodEnd ? "resume" : null : null;
  const restriction = recovery === "retry" ? (ru ? "Повторите просроченный платёж, прежде чем менять тариф." : "Retry the overdue payment before changing plans.")
    : recovery === "resume" ? (ru ? "Включите продление, прежде чем менять тариф." : "Resume renewal before changing plans.") : null;
  function rememberFocus() {
    const active = typeof document === "undefined" ? null : document.activeElement;
    origin.current = typeof HTMLElement !== "undefined" && active instanceof HTMLElement ? active : null;
  }
  function requestConfirmation(value: BillingConfirmationIntent) { rememberFocus(); setIntent(value); }
  useEffect(() => {
    if (confirming) confirmationStage.current?.focus({ preventScroll: true });
    else if (identityRequired) offerStage.current?.focus({ preventScroll: true });
    else if (wasConfirming.current) {
      const source = origin.current;
      const available = source?.isConnected && !source.closest("[hidden]") && !("disabled" in source && source.disabled);
      const fallback = source?.isConnected ? source.closest("details")?.querySelector<HTMLElement>("summary") : null;
      (available ? source : fallback ?? offerStage.current)?.focus({ preventScroll: true });
      origin.current = null;
    }
    wasConfirming.current = confirming;
  }, [confirming, identityRequired]);
  const current = summary && <BillingCurrent summary={summary} account={account} ru={ru} busy={locked} canManage={canManage}
    onCancel={() => requestConfirmation({ kind: "cancel" })} onResume={() => requestConfirmation({ kind: "resume" })} onRetry={() => requestConfirmation({ kind: "retry" })} />;
  async function choose(planId: BillingPlanId) {
    if (controlledTest && planId !== "startup") return;
    rememberFocus();
    if (planId === "startup" && summary?.workspaceKind === "personal" && props.onStartupSetup) { props.onStartupSetup(); return; }
    if (!(props.paymentsAvailable ?? billingPaymentsAvailable)) return;
    if (planId !== "enterprise" && account?.allowedCheckoutPlanIds?.includes(planId)) await props.startCheckout(planId);
    else if (account?.subscription && account.subscription.status !== "canceled") setIntent({ kind: "plan", planId });
    else await props.startCheckout(planId);
  }
  async function confirm(value: BillingConfirmationIntent) {
    if (!(props.paymentsAvailable ?? billingPaymentsAvailable)) return;
    setIntent(null);
    if (value.kind === "plan") await props.changePlan(value.planId);
    else if (value.kind === "cancel") await props.cancel();
    else if (value.kind === "resume") await props.resume();
    else await props.retryPayment();
  }
  return <div className={css.screen} aria-busy={loading || busy}>
    {!summary && loading && <p className={css.loading} role="status">{ru ? "Загружаем подписку…" : "Loading billing…"}</p>}
    {!summary && !loading && <div className={css.empty}><CreditCard size={28} strokeWidth={1.5} aria-hidden="true" /><h3>{ru ? "Биллинг пока недоступен" : "Billing is not available yet"}</h3>
      <p>{ru ? "Не удалось получить сведения о подписке этого рабочего пространства." : "Subscription details are not available for this workspace."}</p>
      <button type="button" className={css.secondary} onClick={props.reload}>{ru ? "Повторить" : "Try again"}</button></div>}
    <ErrorToast message={error && summary ? failureText(error.code, ru) : null}
      retryLabel={ru ? "Повторить" : "Try again"}
      onRetry={busy || (props.canRetryCommand && !(props.paymentsAvailable ?? billingPaymentsAvailable)) ? undefined
        : props.canRetryCommand ? props.retryCommand : props.reload} />
    {error && summary && props.canRetryCommand && <p className={css.note}>{ru
      ? "Повторная проверка использует ту же операцию, чтобы избежать повторного платежа."
      : "Retrying checks the same operation to avoid a duplicate payment."}</p>}
    {!canManage && <div className={css.readOnly}>{current}</div>}
    {canManage && !account && loading && <p className={css.loading} role="status">{ru ? "Загружаем тарифы…" : "Loading plans…"}</p>}
    {canManage && account && <>
      {checkout?.status === "failed" && <p className={css.note} role="status">{ru ? "Тестовый платёж отклонён. Подписка не подключена; можно попробовать снова." : "The simulated payment was declined. No subscription was started; you can try again."}</p>}
      <div ref={confirmationStage} className={css.confirmationStage} hidden={!confirming} tabIndex={-1} role="group" aria-label={ru ? "Подтверждение подписки" : "Subscription confirmation"}>
        {confirming && props.identityConfirmation || <BillingConfirmation key={openCheckout ? checkout.id : "subscription"} intent={intent} checkout={checkout} plans={account.plans} current={account.subscription}
          testMode={props.checkoutMode === "local_test" || controlledTest} controlledTest={controlledTest} busy={locked || !(props.paymentsAvailable ?? billingPaymentsAvailable)} ru={ru} onConfirm={value => void confirm(value)} onCheckout={outcome => { if (props.paymentsAvailable ?? billingPaymentsAvailable) void props.confirmCheckout(outcome); }} onDismiss={() => setIntent(null)} />}
      </div>
      <div ref={offerStage} className={css.offerStage} hidden={confirming} tabIndex={-1} role="group" aria-label={ru ? "Тарифы Falcon" : "Falcon plans"}>
        <BillingPlans plans={account.plans} current={account.subscription} occupiedSeats={account.occupiedSeats} workspaceKind={summary!.workspaceKind} canManage={canManage} paymentsAvailable={props.paymentsAvailable ?? billingPaymentsAvailable} setupAvailable={!!props.onStartupSetup && summary!.workspaceKind === "personal"} offers={account} quotes={account.checkoutQuotes}
          controlledTest={controlledTest} busy={locked || confirming} restriction={restriction} checkoutRecovery={!confirming ? props.identityConfirmation : null} ru={ru} onChoose={id => void choose(id)} onClose={props.onClose}>
          {recovery && <button type="button" className={css.secondary} disabled={locked} onClick={() => requestConfirmation({ kind: recovery })}>{recovery === "retry" ? (ru ? "Повторить платёж" : "Retry payment") : (ru ? "Включить продление" : "Resume renewal")}</button>}
          {account.subscription && <details className={css.management}><summary>{ru ? "Моя подписка" : "Manage subscription"}</summary>{current}</details>}
        </BillingPlans>
      </div>
    </>}
  </div>;
}
