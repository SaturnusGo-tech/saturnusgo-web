"use client";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { publicBillingCatalog } from "../../domain/catalog/public-billing-catalog";
import { BillingPlans } from "../../presentation/plans/BillingPlans";

export function BillingComingSoon({ onClose }: { onClose?(): void }) {
  const { locale } = useTmsLocale();
  return <BillingPlans plans={publicBillingCatalog} current={null} occupiedSeats={0} workspaceKind="personal"
    canManage={false} busy={false} paymentsAvailable={false} ru={locale === "ru"} onClose={onClose} onChoose={() => undefined} />;
}
