import type { PlanRequestAction, PlanRequestStatus } from "../../domain/plan-requests/plan-request";

export const planRequestNames = { individual: "Individual", startup: "Startup", enterprise: "Enterprise" };


const statusLabels: Record<PlanRequestStatus, readonly [string, string]> = {
  requested: ["New request", "Новая заявка"],
  contacted: ["Contacted", "Связались"],
  approved: ["Approved", "Одобрена"],
  activating: ["Preparing", "Подготовка"],
  active: ["Active", "Активна"],
  declined: ["Declined", "Отклонена"],
  withdrawn: ["Withdrawn", "Отменена заявителем"],
  expired: ["Expired", "Срок истёк"],
  revoked: ["Revoked", "Доступ отозван"],
};

const actionLabels: Record<PlanRequestAction, readonly [string, string]> = {
  contact: ["Mark contacted", "Отметить связь"],
  approve: ["Approve pilot access", "Одобрить пилотный доступ"],
  decline: ["Decline request", "Отклонить заявку"],
  revoke: ["Revoke access", "Отозвать доступ"],
  reissue: ["Reissue invitation", "Перевыпустить приглашение"],
  retry: ["Retry preparation", "Повторить подготовку"],
};

const historyLabels: Record<string, readonly [string, string]> = {
  ...statusLabels,
  contact: statusLabels.contacted,
  approve: statusLabels.approved,
  decline: statusLabels.declined,
  revoke: statusLabels.revoked,
  reissue: ["Invitation reissued", "Приглашение перевыпущено"],
  retry: ["Preparation retried", "Подготовка запущена повторно"],
};

const mailLabels: Record<string, readonly [string, string]> = {
  operator_request: ["New request to operator", "Новая заявка оператору"],
  request_received: ["Request received", "Заявка принята"],
  approved: ["Activation invitation", "Приглашение к активации"],
  company_ready: ["Company ready", "Компания готова"],
  pending: ["Queued", "В очереди"],
  queued: ["Queued", "В очереди"],
  sending: ["Sending", "Отправляется"],
  sent: ["Sent", "Отправлено"],
  failed: ["Failed", "Ошибка отправки"],
  retrying: ["Retrying", "Повторная отправка"],
};

export function planRequestCopy(locale: "en" | "ru") {
  const index = locale === "ru" ? 1 : 0;
  const t = (en: string, ru: string) => locale === "ru" ? ru : en;
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  return {
    t,
    status: (status: PlanRequestStatus) => statusLabels[status]?.[index] ?? status,
    action: (action: PlanRequestAction) => actionLabels[action][index],
    event: (event: string) => historyLabels[event]?.[index] ?? event,
    mail: (key: string) => mailLabels[key]?.[index] ?? key,
    date: (value: string) => dates.format(new Date(value)),
  };
}
