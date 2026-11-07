import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Mail, X } from "lucide-react";
import type { BillingPlanId } from "../../domain/billing";
import { planNames, planRequestDraft, planSupportEmail, type PlanRequest, type PlanRequestList } from "../domain/plan-request";
import { planRequestStatus } from "./plan-request-offers";
import css from "./plan-request.module.css";

type Props = {
  planId: BillingPlanId; ru: boolean; data: PlanRequestList | null; request: PlanRequest | null;
  busy: boolean; loading: boolean; error: boolean; failed: boolean; unavailable: boolean; contactOnly?: boolean;
  onClose(): void; onReload(): void; onSubmit(note: string): void; onActivate(request: PlanRequest): void; onEditAddress(request: PlanRequest): void; onWithdraw(request: PlanRequest): void;
};

export function PlanRequestDialog({ planId, ru, data, request, busy, loading, error, failed, unavailable, contactOnly = false, onClose, onReload, onSubmit, onActivate, onEditAddress, onWithdraw }: Props) {
  const modal = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [note, setNote] = useState("");
  const [copyState, setCopyState] = useState<{ kind: "address" | "draft"; copied: boolean } | null>(null);
  const [withdraw, setWithdraw] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const startedOutside = useRef(false);
  const plan = planNames[request?.planId ?? planId];
  const draft = request ? planRequestDraft(request, ru) : null;
  const draftText = draft ? `${draft.subject}\n\n${draft.body}` : "";
  const desktop = typeof navigator !== "undefined" && /(?:^|\s)FalconDesktop\//.test(navigator.userAgent);
  const title = request ? planRequestStatus(request, ru) : contactOnly
    ? (ru ? "Связаться с Falcon" : "Contact Falcon")
    : (ru ? "Запросить подключение" : "Request access");
  const subtitle = request
    ? `${plan} · ${request.reference}`
    : ru ? `Доступ к Falcon ${plan}` : `Access to Falcon ${plan}`;
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

  async function copy(kind: "address" | "draft") {
    try {
      await navigator.clipboard.writeText(kind === "address" ? planSupportEmail : draftText);
      setCopyState({ kind, copied: true });
    } catch { setCopyState({ kind, copied: false }); }
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
        <div className={css.heading}><h2 id={titleId}>{title}</h2><p>{subtitle}</p></div>
        <div className={css.details}>
          <div className={css.publisher}>
            <div><strong>Falcon</strong><span>{ru ? "от Saturnus Go" : "by Saturnus Go"}</span></div>
            <span className={css.label}>{ru ? "По заявке" : "By request"}</span>
          </div>
          {contactOnly && <p>{ru ? "Напишите нам, чтобы обсудить подключение Enterprise для вашей компании." : "Email us to discuss Enterprise for your company."}</p>}
          {!request && !unavailable && <p>{ru ? "Пока мы настраиваем онлайн-оплату, подключаем Falcon по заявке. Напишите нам из приложения, и мы ответим на ваш email, чтобы обсудить условия и подключение." : "While we set up online payments, we’re arranging Falcon access by request. Send us a request here and we’ll reply by email to discuss access and terms."}</p>}
          {request?.status === "requested" || request?.status === "contacted" ? <p>{ru ? "Заявка сохранена. Команда Falcon свяжется с вами по email." : "Your request is saved. The Falcon team will follow up by email."}</p> : null}
          {request?.status === "activating" && <p>{request.preparationError === "DOMAIN_CONFLICT"
            ? (ru ? "Этот адрес уже занят. Выберите другой, чтобы продолжить настройку компании." : "This address is already taken. Choose another one to continue setting up your company.")
            : request.preparationError
            ? (ru ? "Возникла задержка с подготовкой адреса. Данные сохранены. Сообщим по почте, когда компания будет готова." : "Your company address is taking longer than expected. Your details are saved. We’ll email you when it’s ready.")
            : (ru ? "Можно закрыть окно. Мы продолжим настройку и пришлём ссылку на почту." : "You can close this window. We’ll keep setting up your company and email you the link.")}</p>}
          {(request || data) && <dl className={css.metadata}>
            <dt>{ru ? "Пространство" : "Workspace"}</dt><dd>{request?.workspaceName ?? data?.workspace.name}</dd>
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
        {request?.actions.includes("activate") && <button type="button" className={css.primary} disabled={busy || closing} onClick={() => onActivate(request)}>
          {request.planId === "startup" && request.workspaceKind === "personal" ? (ru ? "Настроить компанию" : "Set up company") : (ru ? "Активировать доступ" : "Activate access")}
        </button>}
        {request?.actions.includes("edit_address") && <button type="button" className={css.primary} disabled={busy || closing} onClick={() => onEditAddress(request)}>
          {ru ? "Изменить адрес" : "Edit address"}
        </button>}
        {request?.actions.includes("withdraw") && <div className={css.withdraw}>
          {withdraw && <button type="button" disabled={busy} onClick={() => setWithdraw(false)}>{ru ? "Назад" : "Back"}</button>}
          <button type="button" disabled={busy} onClick={() => { if (withdraw) onWithdraw(request); else setWithdraw(true); }}>{withdraw
            ? (ru ? "Подтвердить отмену" : "Confirm withdrawal") : (ru ? "Отменить заявку" : "Withdraw request")}</button>
        </div>}
        <div className={css.contact}>
          {contactOnly && <a href={`mailto:${planSupportEmail}`}>{planSupportEmail}<ArrowUpRight size={14} aria-hidden="true" /></a>}
          {draft && (desktop
            ? <button type="button" onClick={() => void copy("draft")}><Copy size={14} aria-hidden="true" />{ru ? "Скопировать черновик письма" : "Copy email draft"}</button>
            : <a href={draft.href}>{ru ? "Открыть черновик письма" : "Open email draft"}<ArrowUpRight size={14} aria-hidden="true" /></a>)}
          <button type="button" onClick={() => void copy("address")}><Copy size={14} aria-hidden="true" />{ru ? "Скопировать email" : "Copy email address"}</button>
        </div>
        {copyState?.copied && <p className={css.message} role="status"><Check size={14} aria-hidden="true" />
          {copyState.kind === "address" ? (ru ? "Адрес скопирован" : "Email address copied") : (ru ? "Черновик скопирован" : "Email draft copied")}
        </p>}
        {copyState && !copyState.copied && <label className={css.note}>
          {ru ? "Скопируйте текст вручную" : "Copy the text manually"}
          <textarea rows={copyState.kind === "address" ? 1 : 4} value={copyState.kind === "address" ? planSupportEmail : draftText} readOnly onFocus={event => event.currentTarget.select()} />
        </label>}
      </form>
    </div>
  </dialog>;
}
