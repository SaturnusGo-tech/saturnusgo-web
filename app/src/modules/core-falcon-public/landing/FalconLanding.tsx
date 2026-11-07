"use client";
import { LandingLocaleProvider } from "./localization/context/LandingLocaleProvider";
import { FalconDirection } from "../direction/FalconDirection";
import { useLandingNavigation } from "../direction/navigation/useLandingNavigation";
import type { LandingLocale } from "./localization/model/locale";

export function FalconLanding({ initialLocale = "en" }: { initialLocale?: LandingLocale }) {
  useLandingNavigation();
  return <LandingLocaleProvider initialLocale={initialLocale}><FalconDirection /></LandingLocaleProvider>;
}
