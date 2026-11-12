"use client";

import dynamic from "next/dynamic";
import { TmsLocaleProvider } from "../../localization/context/TmsLocaleProvider";
import { TmsAuthState } from "../../auth/presentation/state/TmsAuthState";

// Authenticated UI imports async component modules. Keep the static entry
// synchronous, as for the workspace and standalone notification settings.
const CompanyAdministrationEntry = dynamic(() => import("./entry/CompanyAdministrationEntry").then(module => module.CompanyAdministrationEntry), {
  ssr: false, loading: () => <TmsAuthState kind="loading" />,
});

export function CompanyAdministrationPage({ section }: { readonly section: "sandbox" | "admin" | "profile" }) {
  return <TmsLocaleProvider><CompanyAdministrationEntry section={section} /></TmsLocaleProvider>;
}
