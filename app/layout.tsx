import type React from "react";
import "./src/shared/styles/globals.css";
import "./src/shared/styles/globals-2.css";
import "./src/shared/styles/mobile-overrides.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import RouteFlagsClient from "./src/shared/_components/RouteFlagsClient";

// === добавлено ===
import ThemeProvider from "./src/shared/theme-provider/provider";
import { LanguageProvider } from "./src/shared/i18n";
// Шрифты Geist (variable), отдают CSS-переменные --font-geist-sans / --font-geist-mono
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// ================

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
      lang="ru"
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

        <Script id="sg-locale-init" strategy="beforeInteractive">{`
          try {
            var key = 'saturnusgo.locale.v1';
            var cookieKey = 'saturnusgo_locale';
            var value = null;
            try { value = localStorage.getItem(key); } catch (_) {}
            if (!/^(ru|en|es)$/.test(value || '')) {
              var match = document.cookie.match(new RegExp('(?:^|; )' + cookieKey + '=(ru|en|es)(?:;|$)'));
              value = match && match[1];
            }
            if (!/^(ru|en|es)$/.test(value || '')) value = 'ru';
            window.__SATURNUSGO_INITIAL_LOCALE__ = value;
            document.documentElement.lang = value;
            document.documentElement.dataset.locale = value;
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
        <ThemeProvider>
          <LanguageProvider>
              <Script
                id="mobile-hard-gate"
                strategy="beforeInteractive"
              >{`(function(){ /* ... */ })();`}</Script>
              <Script
                id="route-flags"
                strategy="beforeInteractive"
              >{`(function(){
                try {
                  var root = document.documentElement;
                  var path = location.pathname || '';
                  if (/^\\/testcases(?:\\/|$)/i.test(path)) {
                    root.setAttribute('data-tms', '1');
                  } else {
                    root.removeAttribute('data-tms');
                  }
                  if (path === '/' || /^\\/(signup|cloud-login)(?:\\/|$)/i.test(path)) {
                    root.setAttribute('data-falcon-public', '1');
                    root.lang = 'ru';
                  } else {
                    root.removeAttribute('data-falcon-public');
                  }
                } catch (_) {}
              })();`}</Script>

              <Suspense fallback={null}>
                <RouteFlagsClient />
              </Suspense>
              {children}

              <Script
                id="prefer-reduced-motion"
                strategy="afterInteractive"
              >{`try{
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
              document.documentElement.setAttribute('data-prm','1');
            }
          }catch(e){}`}</Script>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
