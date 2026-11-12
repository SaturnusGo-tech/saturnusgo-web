"use client";

import { useEffect, useState } from "react";
import { ManagedAccessBoundary } from "../../../auth/managed/composition/ManagedAccessBoundary";
import { LegacyTmsAuthBoundary } from "../../../auth/presentation/boundary/LegacyTmsAuthBoundary";
import { TmsAuthState } from "../../../auth/presentation/state/TmsAuthState";
import { ProfileEntryRedirect } from "../../../profile/composition/ProfileEntryRedirect";
import { AdministrationWorkspace } from "../AdministrationWorkspace";
import { PersonalAdministrationFeature } from "../personal/PersonalAdministrationFeature";

export function CompanyAdministrationEntry({ section }: { readonly section: "sandbox" | "admin" | "profile" }) {
  const [personal, setPersonal] = useState<boolean | null>(null);
  useEffect(() => { setPersonal(section === "admin" && new URLSearchParams(window.location.search).get("account") === "personal"); }, [section]);
  if (personal === null) return <TmsAuthState kind="loading" />;
  if (personal) return <LegacyTmsAuthBoundary><PersonalAdministrationFeature /></LegacyTmsAuthBoundary>;
  return <ManagedAccessBoundary>{(session, logout) =>
    section === "profile" && session.audience === "tenant" ? <ProfileEntryRedirect /> : <AdministrationWorkspace session={session} logout={logout} section={section} />
  }</ManagedAccessBoundary>;
}
