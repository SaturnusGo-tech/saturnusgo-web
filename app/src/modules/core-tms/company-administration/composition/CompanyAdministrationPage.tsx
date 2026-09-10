"use client";

import { TmsLocaleProvider } from "../../localization/context/TmsLocaleProvider";
import { ManagedAccessBoundary } from "../../auth/managed/composition/ManagedAccessBoundary";
import { AdministrationWorkspace } from "./AdministrationWorkspace";

export function CompanyAdministrationPage({ section }: { readonly section: "sandbox" | "admin" | "profile" }) {
  return <TmsLocaleProvider><ManagedAccessBoundary>{(session, logout) =>
    <AdministrationWorkspace session={session} logout={logout} section={section} />
  }</ManagedAccessBoundary></TmsLocaleProvider>;
}
