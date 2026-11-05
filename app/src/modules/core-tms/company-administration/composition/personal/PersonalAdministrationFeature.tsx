"use client";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useWorkspaceCapabilities } from "../../../auth/spaces/capabilities/composition/useWorkspaceCapabilities";
import { BillingLink } from "../../../billing/presentation/link/BillingLink";
import { hasPersonalAdministrationScope } from "../../navigation/personal-administration-route";
import { ResourceState } from "../../presentation/common/ResourceState";
import { PersonalAdministrationWorkspace } from "./PersonalAdministrationWorkspace";

export function PersonalAdministrationFeature() {
  const session = useTmsSession(), { locale } = useTmsLocale();
  const workspaceId = session.workspaceId ?? null;
  const scoped = hasPersonalAdministrationScope(window.location.href, workspaceId);
  const model = useWorkspaceCapabilities(workspaceId, scoped);
  if (!scoped) return <p role="alert">{locale === "ru" ? "Откройте управление из вашего рабочего пространства." : "Open administration from your current workspace."}</p>;
  if (model.loading || model.error) return <ResourceState loading={model.loading} error={model.error} retry={model.reload} />;
  if (!model.value?.teamAdministrationAvailable) return <div><p>{locale === "ru" ? "Управление командой недоступно для текущей подписки." : "Team administration is unavailable for your current subscription."}</p><BillingLink workspaceId={workspaceId!}>{locale === "ru" ? "Тариф и оплата" : "Plan and billing"}</BillingLink></div>;
  return <PersonalAdministrationWorkspace workspaceId={workspaceId!} />;
}
