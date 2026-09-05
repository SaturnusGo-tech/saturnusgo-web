import type { Metadata } from "next";
import { CloudAuthScreen } from "../../src/modules/core-falcon-public";

export const metadata: Metadata = {
  title: { absolute: "Вход в облако — Falcon" },
  description: "Вход в личное рабочее пространство Falcon Cloud.",
  openGraph: {
    title: "Вход в облако — Falcon",
    description: "Вход в личное рабочее пространство Falcon.",
    url: "https://tms.saturnusgo.com/cloud-login/",
    siteName: "Falcon",
  },
  twitter: {
    card: "summary",
    title: "Вход в облако — Falcon",
    description: "Вход в личное рабочее пространство Falcon.",
  },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CloudAuthScreen mode="login" />;
}
