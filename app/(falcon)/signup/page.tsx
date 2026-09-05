import type { Metadata } from "next";
import { CloudAuthScreen } from "../../src/modules/core-falcon-public";

export const metadata: Metadata = {
  title: { absolute: "Создать пространство — Falcon" },
  description: "Регистрация личного рабочего пространства Falcon.",
  openGraph: {
    title: "Создать пространство — Falcon",
    description: "Регистрация личного рабочего пространства Falcon.",
    url: "https://tms.saturnusgo.com/signup/",
    siteName: "Falcon",
  },
  twitter: {
    card: "summary",
    title: "Создать пространство — Falcon",
    description: "Регистрация личного рабочего пространства Falcon.",
  },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CloudAuthScreen mode="register" />;
}
