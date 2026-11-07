import type { BillingPlanId } from "../../domain/billing";
import type { ManualBillingOffers } from "../../presentation/plans/BillingPlans";
import { planNames, type PlanRequest, type PlanRequestList, type PlanRequestStatus } from "../domain/plan-request";

const statusText: Record<PlanRequestStatus, [string, string]> = {
  requested: ["Заявка отправлена", "Request sent"], contacted: ["В работе", "In review"],
  approved: ["Доступ одобрен", "Access approved"], activating: ["Готовим компанию", "Preparing your company"],
  active: ["Доступ активен", "Access active"], declined: ["Заявка отклонена", "Request declined"],
  withdrawn: ["Заявка отменена", "Request withdrawn"], expired: ["Срок истёк", "Request expired"],
  revoked: ["Доступ отозван", "Access revoked"],
};

export function planRequestStatus(request: PlanRequest, ru: boolean) {
  return statusText[request.status][ru ? 0 : 1];
}

export function planRequestOffers(data: PlanRequestList, pending: PlanRequest | null, ru: boolean,
  open: (planId: BillingPlanId, requestId: string | null) => void): ManualBillingOffers {
  const date = (value: string) => new Date(value).toLocaleDateString(ru ? "ru-RU" : "en-US", { dateStyle: "medium" });
  const access = data.access;
  const notice = pending ? `${planNames[pending.planId]} · ${planRequestStatus(pending, ru)} · ${date(pending.createdAt)}`
    : access?.endsAt ? (ru ? `Доступ ${planNames[access.planId]} до ${date(access.endsAt)}` : `${planNames[access.planId]} access until ${date(access.endsAt)}`)
    : access ? (ru ? `Активен ${planNames[access.planId]}` : `${planNames[access.planId]} access active`) : undefined;

  return {
    suggestedPlanId: pending?.planId ?? (access?.planId === "individual" ? "startup" : access?.planId ? "enterprise" : undefined),
    notice,
    action(planId) {
      const existing = pending ?? data.requests.find(item => item.planId === planId && item.status === "active");
      const ineligible = !data.eligiblePlanIds.includes(planId);
      return {
        label: existing ? (ru ? `Заявка на ${planNames[existing.planId]}` : `View ${planNames[existing.planId]} request`)
          : ineligible ? (ru ? "Недоступно для этого пространства" : "Unavailable for this workspace")
          : planId === "enterprise" ? (ru ? "Связаться с нами" : "Contact us")
          : ru ? "Запросить подключение" : "Request access",
        disabled: !existing && ineligible,
        onClick: () => open(planId, existing?.id ?? null),
      };
    },
  };
}
