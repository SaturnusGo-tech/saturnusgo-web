"use client";

import { TmsLocaleProvider } from "../../localization/context/TmsLocaleProvider";
import { ManagedAccessBoundary } from "../../auth/managed/composition/ManagedAccessBoundary";
import { ProfileEntryRedirect } from "../../profile/composition/ProfileEntryRedirect";
import { AdministrationWorkspace } from "./AdministrationWorkspace";

export function CompanyAdministrationPage({ section }: { readonly section: "sandbox" | "admin" | "profile" }) {
  return <TmsLocaleProvider><ManagedAccessBoundary>{(session, logout) =>
    section === "profile" && session.audience === "tenant" ? <ProfileEntryRedirect /> : <AdministrationWorkspace session={session} logout={logout} section={section} />
  }</ManagedAccessBoundary></TmsLocaleProvider>;
}
