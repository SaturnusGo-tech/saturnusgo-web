"use client";
import dynamic from "next/dynamic";
import { TmsAuthBoundary } from "../../../auth/presentation/boundary/TmsAuthBoundary";
import { TmsAuthState } from "../../../auth/presentation/state/TmsAuthState";
import { TmsLocaleProvider } from "../../../localization/context/TmsLocaleProvider";
const NotificationPreferencesWindow = dynamic(() => import("./NotificationPreferencesWindow").then(module => module.NotificationPreferencesWindow), {
  ssr: false, loading: () => <TmsAuthState kind="loading"/>,
});
export function NotificationPreferencesEntry() {
  return <TmsLocaleProvider><TmsAuthBoundary><NotificationPreferencesWindow/></TmsAuthBoundary></TmsLocaleProvider>;
}
