import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Mail, Settings2, X } from "lucide-react";
import { workspaceDisplayName } from "../../../localization/format/workspace/display-name";
import type { BillingPlanId } from "../../domain/billing";
import { planNames, planRequestGmailUrl, planSupportEmail, type PlanRequest, type PlanRequestList } from "../domain/plan-request";
import { planRequestStatus } from "./offers/plan-request-offers";
import css from "./plan-request.module.css";

type Props = {
  planId: BillingPlanId; ru: boolean; data: PlanRequestList | null; request: PlanRequest | null;
  busy: boolean; loading: boolean; error: boolean; failed: boolean; unavailable: boolean; contactOnly?: boolean;
  onClose(): void; onReload(): void; onSubmit(note: string): void; onActivate(request: PlanRequest): void; onEditAddress(request: PlanRequest): void; onWithdraw(request: PlanRequest): void;
};

export function PlanRequestDialog({ planId, ru, data, request, busy, loading, error, failed, unavailable, contactOnly = false, onClose, onReload, onSubmit, onActivate, onEditAddress, onWithdraw }: Props) {
  const modal = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const manageButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [note, setNote] = useState("");
  const [copyState, setCopyState] = useState<"copied" | "manual" | null>(null);
  const [managing, setManaging] = useState(false);
  const manageId = useId();
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const startedOutside = useRef(false);
  const currentPlan = request?.planId ?? planId;
  const plan = planNames[currentPlan];
  const workspace = request ? { name: request.workspaceName, kind: request.workspaceKind } : data?.workspace;
  const canActivate = request?.actions.includes("activate");
  const canEditAddress = request?.actions.includes("edit_address");
  const canWithdraw = request?.actions.includes("withdraw");
  const title = request ? planRequestStatus(request, ru) : contactOnly
    ? (ru ? "Связаться с Falcon" : "Contact Falcon")
    : (ru ? "Запросить подключение" : "Request access");
  const copyLabel = ru ? "Скопировать email" : "Copy email address";
  const date = (value: string) => new Date(value).toLocaleDateString(ru ? "ru-RU" : "en-US", { dateStyle: "medium" });

  useEffect(() => {
    const element = modal.current;
    if (!element) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      element.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  function dismiss() {
    if (closeTimer.current !== null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onClose(); return; }
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 150);
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(planSupportEmail);
      setCopyState("copied");
    } catch {
      setCopyState("manual");
    }
  }

  return <dialog ref={modal} className={css.dialog} aria-labelledby={titleId} data-closing={closing || undefined}
    onCancel={event => { event.preventDefault(); dismiss(); }}
    onPointerDown={event => { startedOutside.current = event.target === event.currentTarget; }}
    onClick={event => { if (startedOutside.current && event.target === event.currentTarget) dismiss(); startedOutside.current = false; }}>
    <div className={css.content}>
      <div className={css.banner}>
        <div className={css.marks} aria-hidden="true">
          <span className={css.markTile}><img src="/falcon/landing/2026-11/falcon-line-mark.svg" alt="" width={26} height={26} /></span>
          <span className={css.dots}><i /><i /><i /></span>
          <span className={css.markTile}><Mail size={23} strokeWidth={1.6} /></span>
        </div>
        <button ref={closeButton} type="button" className={css.close} aria-label={ru ? "Закрыть" : "Close"} onClick={dismiss}><X size={17} aria-hidden="true" /></button>
      </div>
      <form className={css.body} onSubmit={event => { event.preventDefault(); if (!busy && !error && !unavailable && data?.applicant.email && !request) onSubmit(note); }}>
        <div className={css.heading}>
          <h2 id={titleId} aria-live="polite">{title}</h2>
          <p>{ru ? "Подключение тарифа" : "Plan access"}</p>
        </div>
        <div className={css.details}>
          <div className={css.publisher}>
            <div>
              <div className={css.planSignature}><strong>Falcon</strong><span aria-hidden="true">•</span><span className={css.planName}>{plan}</span></div>
              <span className={css.byline}>{ru ? "от Saturnus Go" : "by Saturnus Go"}</span>
            </div>
            <span className={css.label}>{ru ? "По заявке" : "By request"}</span>
          </div>
          {contactOnly && <p>{ru ? "Напишите нам, чтобы обсудить подключение Enterprise для вашей компании." : "Email us to discuss Enterprise for your company."}</p>}
          {!request && !unavailable && <p>{ru ? "Пока мы настраиваем онлайн-оплату, тарифы подключаются по заявке. Мы ответим на email вашей учётной записи." : "While we set up online payments, access is available by request. We’ll reply to the email on your account."}</p>}
          {request?.status === "requested" || request?.status === "contacted" ? <p>{ru ? "Команда Falcon ответит на email, указанный ниже." : "The Falcon team will follow up at the email below."}</p> : null}
          {request?.status === "activating" && <p>{request.preparationError === "DOMAIN_CONFLICT"
            ? (ru ? "Этот адрес уже занят. Выберите другой, чтобы продолжить настройку компании." : "This address is already taken. Choose another one to continue setting up your company.")
            : request.preparationError
            ? (ru ? "Возникла задержка с подготовкой адреса. Данные сохранены. Сообщим по почте, когда компания будет готова." : "Your company address is taking longer than expected. Your details are saved. We’ll email you when it’s ready.")
            : (ru ? "Можно закрыть окно. Мы продолжим настройку и пришлём ссылку на почту." : "You can close this window. We’ll keep setting up your company and email you the link.")}</p>}
          {(request || data) && <dl className={css.metadata}>
            <dt>{ru ? "Пространство" : "Workspace"}</dt><dd>{workspace && workspaceDisplayName(workspace, ru ? "ru" : "en")}</dd>
            <dt>Email</dt><dd>{request?.applicantEmail ?? data?.applicant.email}</dd>
            {request && <><dt>{ru ? "Отправлено" : "Requested"}</dt><dd>{date(request.createdAt)}</dd></>}
            {request?.activationExpiresAt && request.status === "approved" && <><dt>{ru ? "Активировать до" : "Activate by"}</dt><dd>{date(request.activationExpiresAt)}</dd></>}
            {request?.accessEndsAt && request.status === "active" && <><dt>{ru ? "Доступ до" : "Access until"}</dt><dd>{date(request.accessEndsAt)}</dd></>}
          </dl>}
          {!request && !unavailable && planId !== "individual" && data && <label className={css.note}>
            {ru ? "Что важно для вашей команды?" : "What does your team need?"}
            <textarea maxLength={1000} rows={2} value={note} disabled={busy} onChange={event => setNote(event.target.value)} placeholder={ru ? "Необязательно" : "Optional"} />
          </label>}
        </div>
        {unavailable && !contactOnly && <p className={css.message} role="status">{ru ? "Этот тариф недоступен для текущего пространства." : "This plan is unavailable for your current workspace."}</p>}
        {loading && <p className={css.message} role="status">{ru ? "Загружаем данные заявки…" : "Loading request details…"}</p>}
        {((error && !request) || failed) && <p className={css.error} role="alert">{ru ? "Не удалось обновить заявку. Попробуйте ещё раз." : "Couldn’t update the request. Please try again."} <button type="button" onClick={onReload}>{ru ? "Обновить" : "Refresh"}</button></p>}
        {!request && !unavailable && <button type="submit" className={css.primary} disabled={busy || closing || !data?.applicant.email || error}>{busy ? (ru ? "Отправляем…" : "Sending…") : (ru ? "Отправить заявку" : "Send request")}</button>}
        {request && canActivate && <button type="button" className={css.primary} disabled={busy || closing} onClick={() => onActivate(request)}>
          {request.planId === "startup" && request.workspaceKind === "personal" ? (ru ? "Настроить компанию" : "Set up company") : (ru ? "Активировать доступ" : "Activate access")}
        </button>}
        {request && canEditAddress && <button type="button" className={css.primary} disabled={busy || closing} onClick={() => onEditAddress(request)}>
          {ru ? "Изменить адрес" : "Edit address"}
        </button>}
        {request && !canActivate && !canEditAddress && <button type="button" className={css.primary} disabled={closing} onClick={dismiss}>
          {ru ? "Готово" : "Done"}
        </button>}
        {(request || contactOnly) && <div className={css.contact}>
          <span className={css.address}>{planSupportEmail}</span>
          <button type="button" className={css.copy} aria-label={copyLabel} title={copyLabel} onClick={() => void copyAddress()}>
            {copyState === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          </button>
          <a href={planRequestGmailUrl(currentPlan, ru, request?.reference)} target="_blank" rel="noopener noreferrer">
            {ru ? "Открыть Gmail" : "Open Gmail"}<ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>}
        {copyState === "copied" && <p className={css.srOnly} role="status">{ru ? "Адрес скопирован" : "Email address copied"}</p>}
        {copyState === "manual" && <label className={css.note}>
          {ru ? "Скопируйте email вручную" : "Copy the email address manually"}
          <input value={planSupportEmail} readOnly onFocus={event => event.currentTarget.select()} />
        </label>}
        {request && canWithdraw && <div className={css.management}>
          <button ref={manageButton} type="button" className={css.manage} aria-expanded={managing} aria-controls={manageId} disabled={busy || closing} onClick={() => setManaging(!managing)}>
            <Settings2 size={14} aria-hidden="true" />{ru ? "Управление заявкой" : "Manage request"}
          </button>
          <div id={manageId} className={css.confirm} hidden={!managing}>
            {managing && <>
              <strong>{ru ? "Отменить эту заявку?" : "Withdraw this request?"}</strong>
              <p>{ru ? "Мы прекратим её обработку. Если вы передумаете, сможете отправить новую." : "We’ll stop processing it. You can send a new request if you change your mind."}</p>
              <div className={css.confirmActions}>
                <button type="button" disabled={busy || closing} onClick={() => { setManaging(false); manageButton.current?.focus(); }}>{ru ? "Оставить заявку" : "Keep request"}</button>
                <button type="button" className={css.danger} disabled={busy || closing} onClick={() => onWithdraw(request)}>{ru ? "Отменить заявку" : "Withdraw request"}</button>
              </div>
            </>}
          </div>
        </div>}
      </form>
    </div>
  </dialog>;
}
