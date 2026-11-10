import type { Metadata } from "next";
import type React from "react";
import { falconBrandIcons, falconBrandPreview } from "../src/modules/core-falcon-public/shared/brand-metadata";
import "../src/modules/core-tms/presentation/theme/falcon-theme.css";
import { FalconToastProvider } from "../src/modules/core-tms/presentation/workspace/ui/FalconToastProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://tms.saturnusgo.com"),
  applicationName: "Falcon",
  icons: falconBrandIcons,
  robots: { index: false, follow: false },
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
    images: [falconBrandPreview],
  },
  twitter: {
    card: "summary",
    title: "Falcon — управление качеством продукта",
    description: "Единое пространство для ручного и автоматизированного тестирования.",
    images: [falconBrandPreview.url],
  },
};

export default function FalconLayout({ children }: { readonly children: React.ReactNode }) {
  return <>
    <div data-falcon-shell id="app-main" style={{ padding: 0 }}>{children}</div>
    <FalconToastProvider />
  </>;
}
