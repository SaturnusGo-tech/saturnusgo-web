"use client";

import { createCodexEmployeeApi } from "../../codex-employee/data/http/codex-employee-api";
import { useCodexEmployee } from "../../codex-employee/application/state/useCodexEmployee";
import { PersonalCodexConnection } from "../../codex-employee/presentation/personal/PersonalCodexConnection";
import { CodexEmployeeManagement } from "../../codex-employee/presentation/management/CodexEmployeeManagement";
import { CodexEmployeeRow } from "../../codex-employee/presentation/directory/CodexEmployeeRow";
import { CompanyOverview } from "../presentation/company-overview/CompanyOverview";
import { AdministrationJournal } from "../presentation/audit/AdministrationJournal";
import { useCallback, useMemo, useEffect, useRef } from "react";
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
  const http = useMemo(() => createAuthenticatedTmsHttpClient({ apiBase: `${window.location.origin}/api/v1`, credentials: "include" }), []);
  const client = useMemo(() => createAdministrationClient(http), [http]);
  const codexApi = useMemo(() => createCodexEmployeeApi(http), [http]);
  const codex = useCodexEmployee(codexApi, session.audience === "tenant");
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
  const employeeVersion = useRef(codex.employee?.rowVersion);
  useEffect(() => {
    const next = codex.employee?.rowVersion;
    if (employeeVersion.current != null && next != null && employeeVersion.current !== next && canReadCompany) company.refresh();
    employeeVersion.current = next;
  }, [codex.employee?.rowVersion, canReadCompany, company.refresh]);
  return <AdministrationShell companyName={company.value?.name} client={client} onNavigate={navigate} section={section} page={route.page} session={session} logout={logout}>
    {forbidden ? <p>{copy.noPermission}</p> : section === "profile" ? <ProfilePage client={client} personalConnection={session.audience === "tenant" ? <PersonalCodexConnection state={codex} locale={locale} /> : undefined} />
      : route.page === "audit" ? <AdministrationJournal client={client} platform={session.audience === "platform"} />
      : section === "admin" && route.page === "company" ? <CompanyOverview resource={company} />
      : section === "sandbox" ? (route.creating ? <CreateCompany client={client} onBack={onBack} onCreated={onOpen} />
        : route.id ? <CompanyDetail key={route.id} id={route.id} client={client} onBack={onBack} />
          : <CompanyList client={client} onOpen={onOpen} onCreate={onCreate} />)
        : <MemberWorkspace employeeRow={codex.employee ? <CodexEmployeeRow employee={codex.employee} locale={locale} management={<CodexEmployeeManagement state={codex} locale={locale} />} /> : undefined}
            client={client} session={session} id={route.id} creating={route.creating}
            onBack={onBack} onOpen={onOpen} onCreate={onCreate} />}
  </AdministrationShell>;
}
