import type React from "react";
import "./src/shared/styles/globals.css";
import "./src/shared/styles/globals-2.css";
import "./src/shared/styles/mobile-overrides.css";
import "./src/modules/core-investors-methodology/styles/methodology/methodology.css";
import "./src/modules/core-partners/routes/_components/ui/partners.css";
import "./src/modules/core-partners/routes/partners.css";
import "./src/modules/core-partners/routes/globals-partners.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import RouteFlagsClient from "./src/shared/_components/RouteFlagsClient";
import DeckDialogHost from "./src/shared/_components/DeckDialogHost";
import Defer from "./src/shared/_components/defer/Defer";
import DeviceGate from "./src/shared/_components/DeviceGate";
import { PhoneOverlayProvider } from "./src/modules/core-home/ui/blocks/phone-overlay";
import AppHeader from "./src/shared/_components/header/AppHeader";
import CoreHomeFooter from "./src/modules/core-home/ui/blocks/footer";

// === добавлено ===
import ThemeProvider from "./src/shared/theme-provider/provider";
// Шрифты Geist (variable), отдают CSS-переменные --font-geist-sans / --font-geist-mono
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import CookieBanner from "./src/shared/privacy/CookieBanner";
// ================

const ParallaxBG = dynamic(
  () => import("./src/shared/components/shared/orcestarors/ParallaxBG"),
  { ssr: false },
);
const RouteProgress = dynamic(
  () => import("./src/shared/components/shared/common/RouteProgress"),
  { ssr: false },
);
const PageTransition = dynamic(
  () => import("./src/shared/components/shared/transition/PageTransition"),
);

export const metadata: Metadata = {
  metadataBase: new URL("https://saturnusgo.com"),
  title: "SaturnusGo — Urban Mobility & Travel Intelligence",
  description: "One app for rides, hotel bookings, and smart mobility tools.",
  openGraph: {
    title: "SaturnusGo — Urban Mobility & Travel Intelligence",
    description: "One app for rides, hotel bookings, and smart mobility tools.",
    url: "https://saturnusgo.com",
    siteName: "SaturnusGo",
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const pjs = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-pjs",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ⛔ УДАЛЯЕМ Inter.variable; ✅ ДОБАВЛЯЕМ GeistSans/GeistMono классы
    <html
      lang="en"
      className={`font-pjs ${pjs.variable} ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* self-hosted через next/font — preconnect к gstatic больше не нужен */}
        {/* <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /> */}
        <meta name="color-scheme" content="dark light" />

        <Script id="sg-theme-init" strategy="beforeInteractive">{`
          try {
            var t = localStorage.getItem('sg-theme') || 'dark';
            if (t === 'system') {
              t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.classList.toggle('dark', t === 'dark');
          } catch (_) {}
        `}</Script>

        <style>{`
  :root { --app-header-h: 96px; }      /* desktop */
  @media (max-width: 768px){
    :root { --app-header-h: 64px; }    /* mobile */
  }

  /* чтобы якорные ссылки не прятались за хедером */
  html { scroll-padding-top: var(--app-header-h); }
  [id] { scroll-margin-top: var(--app-header-h); }
`}</style>

        <style>{`
          /* Делает текст чуть «плотнее» по умолчанию */
        
          /* На тёмной теме можно ещё подтянуть визуальный вес */
          .dark body {
            font-weight: 500;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          /* Если захочешь суперточно: Geist variable поддерживает ось wght */
        `}</style>
      </head>
      <body>
        <PhoneOverlayProvider>
          <CookieBanner />
          <ThemeProvider>
            <Script
              id="mobile-hard-gate"
              strategy="beforeInteractive"
            >{`(function(){ /* ... */ })();`}</Script>
            <Script
              id="route-flags"
              strategy="beforeInteractive"
            >{`(function(){ /* ... */ })();`}</Script>

            <Suspense fallback={null}>
              <RouteFlagsClient />
            </Suspense>

            {/* Background */}
            <div className="bg-base" />
            <div className="bg-grad bg-grad--1" />
            <div className="bg-grad bg-grad--2" />
            <div className="bg-cracks" />
            <div className="bg-noise" />

            <DeviceGate notMobile>
              <Defer strategy="idle">
                <ParallaxBG />
              </Defer>
            </DeviceGate>

            <AppHeader />

            <main
              id="app-main"
              className="cv-auto"
              style={{ paddingTop: "var(--app-header-h)" }}
            >
              <PageTransition>{children}</PageTransition>
            </main>

            <CoreHomeFooter />

            <Suspense fallback={null}>
              <DeckDialogHost />
            </Suspense>

            <DeviceGate notMobile>
              <Defer strategy="idle">
                <RouteProgress />
              </Defer>
            </DeviceGate>

            <Script
              id="prefer-reduced-motion"
              strategy="afterInteractive"
            >{`try{
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
              document.documentElement.setAttribute('data-prm','1');
            }
          }catch(e){}`}</Script>
          </ThemeProvider>
        </PhoneOverlayProvider>
      </body>
    </html>
  );
}
