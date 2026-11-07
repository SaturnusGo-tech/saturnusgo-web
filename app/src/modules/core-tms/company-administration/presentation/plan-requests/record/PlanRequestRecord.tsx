"use client";

import { ArrowLeft, ChevronRight, Mail } from "lucide-react";
import { useCallback, useState } from "react";
import type { AdministrationPort } from "../../../application/ports/administration-port";
import { useAdministrationCommand } from "../../../application/state/useAdministrationCommand";
import { useAdministrationResource } from "../../../application/state/useAdministrationResource";
import type { PlanRequestAction, PlanRequestChange, PlanRequestDetail } from "../../../domain/plan-requests/plan-request";
import { ResourceState } from "../../common/ResourceState";
import { administrationError } from "../../copy/administration-errors";
import shared from "../../layout/administration.module.css";
import { planRequestCopy, planRequestNames } from "../plan-request-copy";
import styles from "../plan-requests.module.css";
import { PlanRequestActionForm } from "./PlanRequestActionForm";

const operatorActions = ["contact", "approve", "decline", "revoke", "reissue", "retry"] as const;
type Copy = ReturnType<typeof planRequestCopy>;

export function PlanRequestRecord({ client, id, locale, onBack, onOpenCompany }: {
  readonly client: AdministrationPort;
  readonly id: string;
  readonly locale: "en" | "ru";
  readonly onBack: () => void;
  readonly onOpenCompany: (id: string) => void;
}) {
  const copy = planRequestCopy(locale);
  const { t } = copy;
  const load = useCallback((signal: AbortSignal) => client.planRequest(id, signal), [client, id]);
  const resource = useAdministrationResource(load);
  return <div className={styles.screen}>
    <button type="button" className={shared.back} onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />
      {t("Plan requests", "Заявки на планы")}
    </button>
    {resource.value === null || resource.error
      ? <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} />
      : <RequestBody client={client} request={resource.value} refreshing={resource.refreshing} refresh={resource.refresh} locale={locale} copy={copy} onOpenCompany={onOpenCompany} />}
  </div>;
}

function RequestBody({ client, request, refreshing, refresh, locale, copy, onOpenCompany }: {
  readonly client: AdministrationPort;
  readonly request: PlanRequestDetail;
  readonly refreshing: boolean;
  readonly refresh: () => void;
  readonly locale: "en" | "ru";
  readonly copy: Copy;
  readonly onOpenCompany: (id: string) => void;
}) {
  const { t, date, status, event, mail, action: actionLabel } = copy;
  const [operation, setOperation] = useState<PlanRequestAction | null>(null);
  const command = useAdministrationCommand();
  const allowed = operatorActions.filter((action) => request.actions.includes(action));
  const currentOperation = operation && allowed.includes(operation) ? operation : null;
  const companyAvailable = request.workspaceKind === "company" || Boolean(request.companyHostname);
  const subject = encodeURIComponent(`Falcon · ${request.reference}`);
  const mailbox = encodeURIComponent(request.applicantEmail).replace(/%40([^%]*)$/, "@$1");
  const errors: Record<string, string> = {
    PLAN_REQUEST_CONFLICT: t("This request has changed. Refresh its details before trying again.", "Заявка уже изменилась. Обновите её данные и повторите действие."),
    PLAN_REQUEST_FORBIDDEN: t("You do not have permission for this action.", "Недостаточно прав для этого действия."),
    PLAN_REQUEST_NOT_AVAILABLE: t("This action is no longer available. Refresh the request.", "Действие больше недоступно. Обновите заявку."),
    PLAN_REQUEST_SETUP_REQUIRED: t("Ask the applicant to choose another company address before retrying.", "Попросите заявителя выбрать другой адрес компании перед повтором."),
    PLAN_REQUEST_REASON_REQUIRED: t("Enter a reason for revoking access.", "Укажите причину отзыва доступа."),
  };
  async function submit(change: PlanRequestChange) {
    if (!currentOperation || refreshing) return;
    const result = await command.execute(JSON.stringify([request.id, currentOperation, change]),
      (key, signal) => client.changePlanRequest(request.id, currentOperation, change, key, signal));
    if (result) {
      setOperation(null);
      refresh();
    }
  }

  return <>
    <header className={shared.heading}><div>
      <h1>{planRequestNames[request.planId]} <span className={styles.reference}>{request.reference}</span></h1>
      <p>{request.applicantName || request.applicantEmail}</p>
    </div><span className={shared.badge} data-state={request.status === "activating" ? "pending" : request.status}>{status(request.status)}</span></header>
    <div className={styles.actionRow}>
      <a className={shared.button} href={`mailto:${mailbox}?subject=${subject}`}>
        <Mail size={16} aria-hidden="true" />{t("Reply by email", "Ответить по почте")}
      </a>
      {allowed.map((action) => <button type="button" key={action}
        className={action === "approve" ? shared.primary : shared.button}
        aria-expanded={currentOperation === action}
        disabled={command.pending || refreshing}
        onClick={() => {
          command.clearError();
          setOperation(currentOperation === action ? null : action);
        }}>{actionLabel(action)}</button>)}
    </div>
    {currentOperation && <PlanRequestActionForm key={currentOperation} action={currentOperation} request={request} copy={copy}
      error={command.error ? errors[command.error] ?? administrationError(command.error, locale) : null}
      canRefresh={command.error === "PLAN_REQUEST_CONFLICT" || command.error === "PLAN_REQUEST_NOT_AVAILABLE"}
      pending={command.pending || refreshing} submit={submit} onRefresh={() => { command.clearError(); refresh(); }}
      onCancel={() => { command.clearError(); setOperation(null); }} />}

    <div className={styles.detailsGrid}>
      <section className={styles.detail}>
        <h2>{t("Applicant", "Заявитель")}</h2>
        <dl>
          <dt>{t("Verified email", "Подтверждённый email")}</dt><dd>{request.applicantEmail}</dd>
          <dt>{t("Account ID", "ID аккаунта")}</dt><dd><code>{request.applicantIdentityId}</code></dd>
          <dt>{t("Role at submission", "Роль при подаче")}</dt><dd>{request.applicantRole === "workspace_admin" ? t("Administrator", "Администратор") : request.applicantRole}</dd>
          <dt>{t("Email language", "Язык писем")}</dt><dd>{request.locale === "ru" ? t("Russian", "Русский") : t("English", "Английский")}</dd>
        </dl>
        {request.note && <blockquote className={styles.note}>{request.note}</blockquote>}
      </section>
      <section className={styles.detail}>
        <h2>{t("Workspace", "Рабочее пространство")}</h2>
        <dl>
          <dt>{t("Name", "Название")}</dt><dd>{request.workspaceName}</dd>
          <dt>{t("Type at submission", "Тип при подаче")}</dt><dd>{request.workspaceKind === "personal" ? t("Personal", "Личное") : t("Company", "Компания")}</dd>
          <dt>{t("Workspace ID", "ID пространства")}</dt><dd><code>{request.workspaceId}</code></dd>
          {request.access && <><dt>{t("Current plan", "Текущий план")}</dt>
            <dd>{planRequestNames[request.access.planId]}</dd>
            {request.access.endsAt && <><dt>{t("Current access ends", "Текущий доступ до")}</dt>
              <dd><time dateTime={request.access.endsAt}>{date(request.access.endsAt)}</time></dd></>}
          </>}
          {request.companyHostname && <><dt>{t("Company address", "Адрес компании")}</dt><dd>{request.companyHostname}</dd></>}
        </dl>
        {companyAvailable && <button type="button" className={styles.companyLink} onClick={() => onOpenCompany(request.workspaceId)}>
          {t("Open company record", "Открыть карточку компании")}<ChevronRight size={14} aria-hidden="true" />
        </button>}
      </section>
      <section className={styles.detail}>
        <h2>{t("Request and access", "Заявка и доступ")}</h2>
        <dl>
          <dt>{t("Request ID", "ID заявки")}</dt><dd><code>{request.id}</code></dd>
          <dt>{t("Submitted", "Подана")}</dt><dd><time dateTime={request.createdAt}>{date(request.createdAt)}</time></dd>
          <dt>{t("Updated", "Обновлена")}</dt><dd><time dateTime={request.updatedAt}>{date(request.updatedAt)}</time></dd>
          {request.durationDays != null && <><dt>{t("Pilot duration", "Длительность пилота")}</dt>
            <dd>{new Intl.NumberFormat(locale, { style: "unit", unit: "day", unitDisplay: "long" }).format(request.durationDays)}</dd></>}
          {request.activationExpiresAt && <><dt>{t("Activate by", "Активировать до")}</dt>
            <dd><time dateTime={request.activationExpiresAt}>{date(request.activationExpiresAt)}</time></dd></>}
          {request.accessEndsAt && <><dt>{t("Access ends", "Доступ до")}</dt>
            <dd><time dateTime={request.accessEndsAt}>{date(request.accessEndsAt)}</time></dd></>}
          {request.setupId && <><dt>{t("Preparation ID", "ID подготовки")}</dt><dd><code>{request.setupId}</code></dd></>}
          {request.preparationError && <><dt>{t("Preparation issue", "Ошибка подготовки")}</dt><dd><code>{request.preparationError}</code></dd></>}
        </dl>
      </section>
      <section className={styles.detail}>
        <h2>{t("Email delivery", "Доставка писем")}</h2>
        {request.mail.length === 0
          ? <p className={styles.muted}>{t("No delivery events yet.", "Пока нет данных об отправке.")}</p>
          : <ul className={styles.timeline}>{request.mail.map((message, index) => <li key={`${message.kind}-${index}`}>
            <strong>{mail(message.kind)}</strong>
            <small>{mail(message.status)} · {t("Attempts", "Попытки")} {message.attempts}{message.errorCode && <> · {message.errorCode}</>}</small>
          </li>)}</ul>}
      </section>
      <section className={`${styles.detail} ${styles.history}`}>
        <h2>{t("History", "История")}</h2>
        {request.history.length === 0
          ? <p className={styles.muted}>{t("No activity yet.", "Пока нет записей.")}</p>
          : <ol className={styles.timeline}>{request.history.map((entry, index) => <li key={`${entry.createdAt}-${entry.action}-${index}`}>
            <div><strong>{event(entry.action)}</strong><time dateTime={entry.createdAt}>{date(entry.createdAt)}</time></div>
            {entry.actorLabel && <small>{entry.actorLabel}</small>}
            {entry.note && <p className={styles.note}>{entry.note}</p>}
          </li>)}</ol>}
      </section>
    </div>
  </>;
}
