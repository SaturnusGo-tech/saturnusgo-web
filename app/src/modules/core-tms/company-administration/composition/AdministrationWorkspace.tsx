"use client";

import { CompanyOverview } from "../presentation/company-overview/CompanyOverview";
import { AdministrationJournal } from "../presentation/audit/AdministrationJournal";
import { useCallback, useMemo } from "react";
import { useAdministrationResource } from "../application/state/useAdministrationResource";
import type { SignedInCompanySession } from "../../auth/managed/domain/managed-access";
import { createAuthenticatedTmsHttpClient } from "../../auth/http/createAuthenticatedTmsHttpClient";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { createAdministrationClient } from "../data/administration-client";
import { useAdministrationNavigation } from "../application/navigation/useAdministrationNavigation";
import { AdministrationShell } from "../presentation/layout/AdministrationShell";
import { administrationCopy } from "../presentation/copy/administration-copy";
import { CompanyList } from "../presentation/companies/CompanyList";
import { CreateCompany } from "../presentation/companies/CreateCompany";
import { CompanyDetail } from "../presentation/company-detail/CompanyDetail";
import { MemberWorkspace } from "../presentation/directory/MemberWorkspace";
import { ProfilePage } from "../presentation/profile-page/ProfilePage";

export function AdministrationWorkspace({ session, logout, section: initialSection }: {
  readonly session: SignedInCompanySession; readonly logout: () => Promise<void>; readonly section: "sandbox" | "admin" | "profile";
}) {
  const client = useMemo(() => createAdministrationClient(createAuthenticatedTmsHttpClient({ apiBase: `${window.location.origin}/api/v1`, credentials: "include" })), []);
  const { route, navigate } = useAdministrationNavigation();
  const section = route.section ?? initialSection;
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const onOpen = (id: string) => navigate({ id, creating: false });
  const onBack = () => navigate({ id: null, creating: false });
  const onCreate = () => navigate({ id: null, creating: true });
  const forbidden = (section === "sandbox" && session.audience !== "platform")
    || (section === "admin" && (session.audience !== "tenant" || session.identity.role !== "workspace_admin"));
  const canReadCompany = session.audience === "tenant" && session.identity.role === "workspace_admin";
  const company = useAdministrationResource(useCallback((signal: AbortSignal) => canReadCompany
    ? client.ownCompany(signal) : Promise.resolve(null), [client, canReadCompany]));
  return <AdministrationShell companyName={company.value?.name} client={client} onNavigate={navigate} section={section} page={route.page} session={session} logout={logout}>
    {forbidden ? <p>{copy.noPermission}</p> : section === "profile" ? <ProfilePage client={client} />
      : route.page === "audit" ? <AdministrationJournal client={client} platform={session.audience === "platform"} />
      : section === "admin" && route.page === "company" ? <CompanyOverview resource={company} />
      : section === "sandbox" ? (route.creating ? <CreateCompany client={client} onBack={onBack} onCreated={onOpen} />
        : route.id ? <CompanyDetail key={route.id} id={route.id} client={client} onBack={onBack} />
          : <CompanyList client={client} onOpen={onOpen} onCreate={onCreate} />)
        : <MemberWorkspace client={client} session={session} id={route.id} creating={route.creating}
            onBack={onBack} onOpen={onOpen} onCreate={onCreate} />}
  </AdministrationShell>;
}
