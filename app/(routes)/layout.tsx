import type React from "react";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import "../src/modules/core-investors-methodology/styles/methodology/methodology.css";
import "../src/modules/core-partners/routes/_components/ui/partners.css";
import "../src/modules/core-partners/routes/partners.css";
import "../src/modules/core-partners/routes/globals-partners.css";
import AppHeader from "../src/shared/_components/header/AppHeader";
import DeckDialogHost from "../src/shared/_components/DeckDialogHost";
import Defer from "../src/shared/_components/defer/Defer";
import DeviceGate from "../src/shared/_components/DeviceGate";
import PageTransition from "../src/shared/components/shared/transition/PageTransition";
import CookieBanner from "../src/shared/privacy/CookieBanner";
import CoreHomeFooter from "../src/modules/core-home/ui/blocks/footer";
import { PhoneOverlayProvider } from "../src/modules/core-home/ui/blocks/phone-overlay";

const ParallaxBG = dynamic(
  () => import("../src/shared/components/shared/orcestarors/ParallaxBG"),
  { ssr: false },
);
const RouteProgress = dynamic(
  () => import("../src/shared/components/shared/common/RouteProgress"),
  { ssr: false },
);

export default function RoutesLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <PhoneOverlayProvider>
      <CookieBanner />
      <div className="bg-base" />
      <div className="bg-grad bg-grad--1" />
      <div className="bg-grad bg-grad--2" />
      <div className="bg-cracks" />
      <div className="bg-noise" />
      <DeviceGate notMobile><Defer strategy="idle"><ParallaxBG /></Defer></DeviceGate>
      <AppHeader />
      <main id="app-main" className="cv-auto" style={{ paddingTop: "var(--app-header-h)" }}>
        <PageTransition>{children}</PageTransition>
      </main>
      <CoreHomeFooter />
      <Suspense fallback={null}><DeckDialogHost /></Suspense>
      <DeviceGate notMobile><Defer strategy="idle"><RouteProgress /></Defer></DeviceGate>
    </PhoneOverlayProvider>
  );
}
