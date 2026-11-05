"use client";
import { useCallback, useMemo } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useWorkspaceCodex } from "../../../codex-employee/composition/workspace/useWorkspaceCodex";
import { CompanyCodexAdminFeature } from "../../../codex-employee/composition/admin/CompanyCodexAdminFeature";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { useAdministrationNavigation } from "../../application/navigation/useAdministrationNavigation";
import { createAdministrationClient } from "../../data/administration-client";
import { ResourceState } from "../../presentation/common/ResourceState";
import { CompanyOverview } from "../../presentation/company-overview/CompanyOverview";
import { AdministrationJournal } from "../../presentation/audit/AdministrationJournal";
import { MemberWorkspace } from "../../presentation/directory/MemberWorkspace";
import { PersonalAdministrationShell } from "../../presentation/personal/PersonalAdministrationShell";

export function PersonalAdministrationWorkspace({ workspaceId }: { workspaceId: string }) {
  const http = useTmsHttpClient(), session = useTmsSession();
  const client = useMemo(() => createAdministrationClient(http), [http]);
  const company = useAdministrationResource(useCallback((signal: AbortSignal) => client.ownCompany(signal), [client]));
  const { route, navigate } = useAdministrationNavigation();
  const { locale } = useTmsLocale();
  const codex = useWorkspaceCodex(route.page === "codex", workspaceId);
  const actor = { id: session.subject?.replace(/^cloud:/, "") ?? "", owner: true, selfProfileOnly: true, memberAvatars: false, canTransferOwnership: false, managedReauthentication: false };
  const page = route.page === "company" || route.page === "audit" || route.page === "codex" ? route.page : undefined;
  return <PersonalAdministrationShell workspaceId={workspaceId} companyName={company.value?.name} page={page} onNavigate={navigate}>
    {company.loading || company.error || !company.value ? <ResourceState loading={company.loading} error={company.error} retry={company.refresh} />
      : page === "codex" ? <CompanyCodexAdminFeature http={http} status={codex} locale={locale} allowed onChanged={company.refresh} />
      : page === "company" ? <CompanyOverview resource={company} />
        : page === "audit" ? <AdministrationJournal client={client} platform={false} />
          : <MemberWorkspace actor={actor} client={client} id={route.id} creating={route.creating} onBack={() => navigate({ id: null, creating: false })}
            onOpen={id => navigate({ id, creating: false })} onCreate={() => navigate({ id: null, creating: true })} />}
  </PersonalAdministrationShell>;
}
