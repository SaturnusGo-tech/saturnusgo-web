"use client";
import { LandingLocaleProvider } from "./localization/context/LandingLocaleProvider";
import { FalconDirection } from "../direction/FalconDirection";
import { useLandingNavigation } from "../direction/navigation/useLandingNavigation";
import type { LandingLocale } from "./localization/model/locale";

export function FalconLanding({ initialLocale = "en" }: { initialLocale?: LandingLocale }) {
  return <LandingLocaleProvider initialLocale={initialLocale}><LandingContent /></LandingLocaleProvider>;
}

function LandingContent() {
  const openDemo = useLandingNavigation();
  return <FalconDirection onDemo={openDemo} />;
}
