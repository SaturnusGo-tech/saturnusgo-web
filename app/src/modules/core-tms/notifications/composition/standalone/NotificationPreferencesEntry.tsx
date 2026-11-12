"use client";
import { TmsAuthBoundary } from "../../../auth/presentation/boundary/TmsAuthBoundary";
import { TmsLocaleProvider } from "../../../localization/context/TmsLocaleProvider";
import { NotificationPreferencesWindow } from "./NotificationPreferencesWindow";
export function NotificationPreferencesEntry() {
  return <TmsLocaleProvider><TmsAuthBoundary><NotificationPreferencesWindow/></TmsAuthBoundary></TmsLocaleProvider>;
}
