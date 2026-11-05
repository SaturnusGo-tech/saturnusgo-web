import type { ComponentProps } from "react";
import type { BillingSummary } from "../../domain/billing";
import { BillingLink } from "../link/BillingLink";

type Props = Omit<ComponentProps<typeof BillingLink>, "children"> & {
  summary: BillingSummary | null; loading: boolean; failed: boolean; ru: boolean; neutral?: boolean;
};
const planNames = { individual: "Individual", startup: "Startup", enterprise: "Enterprise" };

export function PlanMenuLink({ summary, loading, failed, ru, neutral = false, ...props }: Props) {
  const label = neutral ? (ru ? "Посмотреть тарифы" : "View plans") : summary ? (summary.planId ? planNames[summary.planId] : ru ? "Нет подписки" : "No subscription")
    : loading ? (ru ? "Загружаем тариф…" : "Loading plan…")
    : failed ? (ru ? "Тариф недоступен" : "Plan unavailable") : (ru ? "Тариф и оплата" : "Plan and billing");
  return <BillingLink {...props} aria-label={`${ru ? "Тариф и оплата" : "Plan and billing"}: ${label}`} data-testid="account-plan">{label}</BillingLink>;
}
