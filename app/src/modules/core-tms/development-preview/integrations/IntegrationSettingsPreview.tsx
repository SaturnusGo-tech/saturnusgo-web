"use client";
import { TmsLocaleProvider } from "../../localization/context/TmsLocaleProvider";
import { IntegrationPreviewScene } from "./scene/IntegrationPreviewScene";
export function IntegrationSettingsPreview() {
  if (process.env.NODE_ENV === "production") return null;
  return <TmsLocaleProvider initialLocale={new URLSearchParams(window.location.search).get("lang") === "ru" ? "ru" : "en"}><IntegrationPreviewScene/></TmsLocaleProvider>;
}
