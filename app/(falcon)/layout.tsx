import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://tms.saturnusgo.com"),
  applicationName: "Falcon",
  title: {
    default: "Falcon — управление качеством продукта",
    template: "%s | Falcon",
  },
  description: "Тест-кейсы, запуски, дефекты и аналитика качества в едином рабочем пространстве Falcon.",
  openGraph: {
    title: "Falcon — управление качеством продукта",
    description: "Единое пространство для ручного и автоматизированного тестирования.",
    url: "https://tms.saturnusgo.com/",
    siteName: "Falcon",
  },
  twitter: {
    card: "summary_large_image",
    title: "Falcon — управление качеством продукта",
    description: "Единое пространство для ручного и автоматизированного тестирования.",
  },
};

export default function FalconLayout({ children }: { readonly children: React.ReactNode }) {
  return <div id="app-main" style={{ padding: 0 }}>{children}</div>;
}
