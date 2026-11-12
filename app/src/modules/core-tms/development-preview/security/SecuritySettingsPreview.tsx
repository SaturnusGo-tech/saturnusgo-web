"use client";
import { TmsLocaleProvider } from "../../localization/context/TmsLocaleProvider";
import { SecurityPreviewScene } from "./scene/SecurityPreviewScene";

export function SecuritySettingsPreview() {
  if (process.env.NODE_ENV === "production") return null;
  const locale = new URLSearchParams(window.location.search).get("lang") === "ru" ? "ru" : "en";
  return <TmsLocaleProvider initialLocale={locale}><SecurityPreviewScene/></TmsLocaleProvider>;
}
