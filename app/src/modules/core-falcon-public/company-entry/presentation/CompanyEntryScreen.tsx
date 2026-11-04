"use client";
import { SignInFeature } from "../../../core-tms/auth/sign-in/composition/SignInFeature";
import { TmsLocaleProvider } from "../../../core-tms/localization/context/TmsLocaleProvider";

export function CompanyEntryScreen({ signup = false }: { readonly signup?: boolean }) {
  return <TmsLocaleProvider><SignInFeature signup={signup} /></TmsLocaleProvider>;
}
