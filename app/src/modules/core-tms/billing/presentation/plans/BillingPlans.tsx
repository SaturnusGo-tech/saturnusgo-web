import { useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, Layers2, ListChecks, Network, ShieldCheck, UsersRound, X } from "lucide-react";
import type { BillingPlan, BillingPlanId, BillingSubscription } from "../../domain/billing";
import css from "./plans.module.css";

export type BillingOffers = {
  suggestedPlanId: BillingPlanId | null;
  allowedCheckoutPlanIds: readonly BillingPlanId[];
  allowedChangePlanIds: readonly BillingPlanId[];
  contactSales: boolean;
};
export type ManualBillingOffers = {
  suggestedPlanId?: BillingPlanId;
  action(planId: BillingPlanId): { label: string; disabled?: boolean; onClick(): void };
  notice?: string;
};
type Props = {
  manualOffers?: ManualBillingOffers;
  plans: readonly BillingPlan[]; current: BillingSubscription | null; occupiedSeats: number;
  workspaceKind: "personal" | "company"; canManage: boolean; busy: boolean; ru: boolean;
  offers?: BillingOffers; quotes?: readonly { planId: BillingPlanId; subtotal: number; currency: "USD"; periodEnd: string | null; prorated: boolean }[];
  children?: ReactNode; checkoutRecovery?: ReactNode; restriction?: string | null; paymentsAvailable?: boolean; setupAvailable?: boolean; controlledTest?: boolean; onClose?(): void;
  onChoose(planId: BillingPlanId): void;
};
const names = { individual: "Individual", startup: "Startup", enterprise: "Enterprise" };
const order: BillingPlanId[] = ["individual", "startup", "enterprise"];
export function BillingPlans({ plans, current, occupiedSeats, workspaceKind, canManage, busy, ru, offers, manualOffers, quotes, children, checkoutRecovery, restriction, paymentsAvailable = true, setupAvailable = false, controlledTest = false, onClose, onChoose }: Props) {
  const [selection, setSelection] = useState<{ id: BillingPlanId; context: string } | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const active = current && current.status !== "canceled" ? current : null;
  const fallback = !active && workspaceKind === "personal" ? "individual" : active?.planId === "individual" ? "startup" : "enterprise";
  const context = `${current?.planId}:${current?.status}:${manualOffers?.suggestedPlanId ?? offers?.suggestedPlanId}`;
  const selectedId = controlledTest ? "startup" : selection?.context === context ? selection.id : manualOffers?.suggestedPlanId ?? offers?.suggestedPlanId ?? fallback;
  const plan = plans.find(item => item.id === selectedId);
  const enterprise = selectedId === "enterprise";
  const quote = manualOffers ? undefined : quotes?.find(item => item.planId === selectedId);
  const money = (amount: number, currency: string) => new Intl.NumberFormat(ru ? "ru-RU" : "en-US", { style: "currency", currency, maximumFractionDigits: amount % 100 ? 2 : 0 }).format(amount / 100);
  const checkoutAllowed = offers?.allowedCheckoutPlanIds.includes(selectedId);
  const available = offers ? Boolean(checkoutAllowed || offers.allowedChangePlanIds.includes(selectedId))
    : Boolean(plan && plan.workspaceKind === workspaceKind && occupiedSeats <= plan.seats);
  const isCurrent = active?.planId === selectedId;
  const scheduled = active?.pendingPlanId === selectedId;
  const unavailable = paymentsAvailable && !enterprise && !available;
  const preparing = setupAvailable && selectedId === "startup" && available;
  const disabled = (!paymentsAvailable && !preparing) || busy || Boolean(restriction) || unavailable || isCurrent || scheduled;
  const requestAction = manualOffers?.action(selectedId);
  const seats = plan?.seats;
  const features = [
    { icon: UsersRound, title: enterprise ? (ru ? "Ваша команда" : "Your team") : seats ? `${seats} ${ru ? seats === 1 ? "место" : "мест" : seats === 1 ? "seat" : "seats"}` : (ru ? "Ваше пространство" : "Your workspace"),
      detail: enterprise ? (ru ? "Обсудим места и доступ" : "Discuss capacity and access") : selectedId === "individual" ? (ru ? "Для личной работы" : "For your own workflow") : (ru ? "Для совместной работы" : "For a shared workflow") },
    { icon: enterprise ? ShieldCheck : Layers2, title: enterprise ? (ru ? "Роли и доступ" : "Roles and access") : (ru ? "База тестов" : "Test library"), detail: enterprise ? (ru ? "Обсудим права сотрудников" : "Discuss member permissions") : (ru ? "Кейсы, наборы и общие шаги" : "Cases, suites and shared steps") },
    { icon: enterprise ? Network : ListChecks, title: enterprise ? (ru ? "Единый вход SAML" : "SAML single sign-on") : (ru ? "Прогоны и результаты" : "Runs and results"), detail: enterprise ? (ru ? "Проверим требования компании" : "Review company sign-in requirements") : (ru ? "Проверки и доказательства" : "Execution and evidence") },
    { icon: selectedId === "startup" ? UsersRound : Network, title: selectedId === "startup" ? (ru ? "Управление командой" : "Team administration") : enterprise ? (ru ? "Условия подключения" : "Setup and terms") : (ru ? "Интеграции" : "Integrations"), detail: selectedId === "startup" ? (ru ? "Сотрудники и приглашения" : "Members and invitations") : enterprise ? (ru ? "Обсудим с вами напрямую" : "Let’s discuss your setup") : (ru ? "Ваши инструменты рядом" : "Connect your existing tools") },
  ];
  const reason = restriction ?? (unavailable ? !plan ? (ru ? "Тариф пока недоступен. Обновите сведения о подписке." : "This plan is unavailable. Refresh your billing details.")
    : occupiedSeats > plan.seats ? (ru ? `Занято мест: ${occupiedSeats}. Выберите тариф для вашей команды.` : `${occupiedSeats} seats are occupied. Choose a plan that fits your team.`)
      : (ru ? "Этот тариф недоступен для текущего пространства." : "This plan is not available for your current workspace.") : null);
  function select(id: BillingPlanId) { setSelection({ id, context }); setShowOptions(false); }
  return <section className={css.offer} aria-labelledby="billing-plans-title" data-offer={selectedId}>
    <div className={css.visual}>
      {onClose && <button type="button" className={css.close} onClick={onClose} aria-label={ru ? "Закрыть тарифы" : "Close plans"}><X size={24} strokeWidth={1.5} aria-hidden="true" /></button>}
      <div className={css.logoTile}><span className={css.logo} aria-hidden="true" /></div>
      <p className={css.eyebrow}>{ru ? "БОЛЬШЕ С FALCON" : "UPGRADE YOUR WORKFLOW"}</p>
      <h3 id="billing-plans-title" className={css.title}>{enterprise ? (ru ? "Новый масштаб с" : "Go further with") : (ru ? "Больше возможностей с" : "Unlock features with")} <span>{names[selectedId]}</span></h3>
      <p className={css.subtitle}>{enterprise ? (ru ? "Обсудим, как Falcon подойдёт вашей компании." : "Let’s find the right Falcon setup for your company.")
        : selectedId === "individual" ? (ru ? "Ваш рабочий процесс тестирования — в одном месте." : "Your testing workflow, together in one place.")
          : (ru ? "Общее пространство для тестирования всей командой." : "One testing workspace for your whole team.")}</p>
      <div className={css.scene}><img className={css.artwork} src={`/falcon/billing/${selectedId}.webp?v=20261105`} alt="" width={2048} height={800} decoding="async" />
        <span className={css.artLabel}>{ru ? "Ваш рабочий процесс" : "Your workflow"}</span><span className={css.artLabel}>{selectedId === "individual" ? (ru ? "Ваш темп" : "Your own pace") : (ru ? "Ваша команда" : "Your team")}</span></div>
    </div>
    <ul className={css.features}>{features.map(({ icon: Icon, title, detail }) => <li key={title}><span className={css.featureIcon}><Icon size={17} strokeWidth={1.5} aria-hidden="true" /></span><div><strong>{title}</strong><span>{detail}</span></div></li>)}</ul>
    <footer className={css.footer}>
      <div className={css.summary}>
      {enterprise ? <div className={css.contactPrice}><strong>{ru ? "Индивидуальные условия" : "Let’s talk about your team"}</strong><span>{ru ? "Места и условия обсудим вместе." : "We’ll discuss capacity and terms together."}</span></div>
        : <div className={css.price}><strong>{quote?.prorated ? money(quote.subtotal, quote.currency) : plan ? money(plan.amount, plan.currency) : "—"}</strong><div><span>{quote?.prorated ? (ru ? "к оплате сейчас" : "due now") : (ru ? "в месяц" : "per month")}</span><small>{quote?.prorated && plan ? (ru ? `Затем ${money(plan.amount, plan.currency)} в месяц · без налогов` : `Then ${money(plan.amount, plan.currency)} / month · excluding tax`) : (ru ? "USD · без налогов" : "USD · excluding tax")}</small></div></div>}
      <div className={css.controls}>{!controlledTest && <div className={css.otherPlans}><button type="button" className={css.disclosure} aria-expanded={showOptions} aria-controls="billing-other-plans" onClick={() => setShowOptions(value => !value)}>{ru ? "Другие тарифы" : "Other plans"}<ChevronDown size={16} aria-hidden="true" data-open={showOptions} /></button>
        {showOptions && <div id="billing-other-plans" className={css.options} role="group" aria-label={ru ? "Выбрать тариф для просмотра" : "Choose a plan to view"}>{order.map(id => <button type="button" key={id} data-view-plan={id} aria-pressed={id === selectedId} onClick={() => select(id)}>{names[id]}{id === selectedId && <Check size={14} aria-hidden="true" />}</button>)}</div>}
      </div>}{children}</div></div>
      {reason && <p className={css.reason} role="status">{reason}</p>}
      {requestAction ? <>
        <button type="button" data-plan={selectedId} className={css.action} disabled={requestAction.disabled} onClick={requestAction.onClick}>{requestAction.label}<ArrowRight size={16} aria-hidden="true" /></button>
        {manualOffers?.notice && <p className={css.terms} role="status">{manualOffers.notice}</p>}
      </> : checkoutRecovery || <>{(canManage || !paymentsAvailable) && (enterprise && paymentsAvailable ? <a className={css.action} href="mailto:falcon@saturnusgo.com">{ru ? "Связаться с нами" : "Contact us"}<ArrowRight size={16} aria-hidden="true" /></a>
        : <button type="button" data-plan={selectedId} className={css.action} disabled={disabled} onClick={paymentsAvailable || preparing ? () => onChoose(selectedId) : undefined}>{enterprise ? <>{ru ? "Связаться с нами" : "Contact us"}<ArrowRight size={16} aria-hidden="true" /></> : isCurrent ? <><Check size={16} aria-hidden="true" />{ru ? "Текущий тариф" : "Current plan"}</> : scheduled ? (ru ? "Переход запланирован" : "Change scheduled") : busy ? (ru ? "Подождите…" : "Please wait…") : restriction ? (ru ? "Сначала восстановите подписку" : "Resolve subscription first") : preparing ? (ru ? "Подготовить компанию" : "Set up company") : <>{ru ? `Выбрать ${names[selectedId]}` : `Choose ${names[selectedId]}`}<ArrowRight size={16} aria-hidden="true" /></>}</button>)}
      {controlledTest ? <p className={css.terms} role="status">{ru ? "Тестовый режим · без списаний" : "Test mode · no charge"}</p> : !paymentsAvailable ? <p className={css.terms} role="status">{ru ? "Оплата скоро станет доступна" : "Payments are coming soon"}</p>
        : !enterprise && <p className={css.terms}>{quote?.prorated ? (ru ? "Доплата за остаток периода. Дата продления не изменится." : "Prorated for the remaining period. Your renewal date stays the same.") : active && !checkoutAllowed ? (ru ? "Изменение вступит в силу при следующем продлении." : "Changes take effect at your next renewal.") : (ru ? "Проверьте и подтвердите подключение на следующем шаге." : "Review and confirm your subscription in the next step.")}</p>}</>}
    </footer>
  </section>;
}
