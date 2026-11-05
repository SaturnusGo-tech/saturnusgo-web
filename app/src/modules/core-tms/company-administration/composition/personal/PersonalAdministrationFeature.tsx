"use client";
import { useMemo } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useBillingSummary } from "../../../billing/application/useBillingSummary";
import { createBillingApi } from "../../../billing/data/http/billing-api";
import { BillingLink } from "../../../billing/presentation/link/BillingLink";
import { hasPersonalAdministrationScope } from "../../navigation/personal-administration-route";
import { ResourceState } from "../../presentation/common/ResourceState";
import { PersonalAdministrationWorkspace } from "./PersonalAdministrationWorkspace";

export function PersonalAdministrationFeature() {
  const session = useTmsSession(), http = useTmsHttpClient(), { locale } = useTmsLocale();
  const workspaceId = session.workspaceId ?? null;
  const scoped = session.kind === "cloud" && hasPersonalAdministrationScope(window.location.href, workspaceId);
  const port = useMemo(() => createBillingApi(http), [http]);
  const model = useBillingSummary({ port, workspaceId, enabled: scoped });
  if (!scoped) return <p role="alert">{locale === "ru" ? "Откройте управление из вашего рабочего пространства." : "Open administration from your current workspace."}</p>;
  if (model.loading || model.error) return <ResourceState loading={model.loading} error={model.error?.code ?? null} retry={model.reload} />;
  if (!model.summary?.teamAdministration || !model.summary.canManage) return <div><p>{locale === "ru" ? "Управление командой недоступно для текущей подписки." : "Team administration is unavailable for your current subscription."}</p><BillingLink workspaceId={workspaceId!}>{locale === "ru" ? "Тариф и оплата" : "Plan and billing"}</BillingLink></div>;
  return <PersonalAdministrationWorkspace workspaceId={workspaceId!} />;
}
