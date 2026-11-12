"use client";
import { LandingLocaleProvider } from "./localization/context/LandingLocaleProvider";
import { FalconDirection } from "../direction/FalconDirection";
import { useLandingNavigation } from "../direction/navigation/useLandingNavigation";
import type { LandingLocale } from "./localization/model/locale";
import { LandingThemeProvider } from './theme/LandingTheme';

export function FalconLanding({ initialLocale = "en" }: { initialLocale?: LandingLocale }) {
  useLandingNavigation();
  return <LandingThemeProvider><LandingLocaleProvider initialLocale={initialLocale}><FalconDirection /></LandingLocaleProvider></LandingThemeProvider>;
}
