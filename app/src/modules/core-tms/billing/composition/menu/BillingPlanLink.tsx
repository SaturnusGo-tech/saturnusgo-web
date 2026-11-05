"use client";
import { useMemo, type ComponentProps } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useBillingSummary } from "../../application/useBillingSummary";
import { createBillingApi } from "../../data/http/billing-api";
import { createPreviewBillingPort } from "../../data/preview/preview-billing";
import { PlanMenuLink } from "../../presentation/menu/PlanMenuLink";
import { billingPaymentsAvailable } from "../../domain/catalog/billing-availability";

type Props = Omit<ComponentProps<typeof PlanMenuLink>, "summary" | "loading" | "failed" | "ru"> & { enabled?: boolean };

export function BillingPlanLink({ enabled = true, ...props }: Props) {
  const { locale } = useTmsLocale();
  return billingPaymentsAvailable ? <ConnectedBillingPlanLink {...props} enabled={enabled} />
    : <PlanMenuLink {...props} summary={null} loading={false} failed={false} ru={locale === "ru"} neutral />;
}
function ConnectedBillingPlanLink({ enabled = true, ...props }: Props) {
  const http = useOptionalTmsHttpClient(), session = useOptionalTmsSession(), { locale } = useTmsLocale();
  const preview = process.env.NODE_ENV !== "production" && session?.subject === "preview:mercury";
  const workspaceId = props.workspaceId ?? session?.workspaceId ?? null;
  const port = useMemo(() => preview && workspaceId ? createPreviewBillingPort(session?.workspaceKind ?? "company", workspaceId)
    : http ? createBillingApi(http) : null, [http, preview, workspaceId, session?.workspaceKind]);
  const model = useBillingSummary({ port, workspaceId, enabled: enabled && Boolean(session) });
  return <PlanMenuLink {...props} summary={model.summary} loading={model.loading} failed={Boolean(model.error)} ru={locale === "ru"} />;
}
