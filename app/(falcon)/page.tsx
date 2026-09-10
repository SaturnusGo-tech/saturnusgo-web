import type { Metadata } from "next";
import { FalconLanding } from "../src/modules/core-falcon-public";

export const metadata: Metadata = {
  title: { absolute: "Falcon: управление тестированием и качеством продукта" },
  description: "Планируйте тестирование, запускайте проверки и следите за исправлениями в Falcon. Посмотрите продукт в работе и свяжитесь с нами для подключения.",
  alternates: { canonical: "https://tms.saturnusgo.com/" },
  openGraph: {
    title: "Falcon: управление качеством продукта",
    description: "От плана релиза до проверки исправления. Тест-кейсы, прогоны, YouTrack и результаты команды в Falcon.",
    url: "https://tms.saturnusgo.com/",
    siteName: "Falcon",
    images: [{ url: "https://tms.saturnusgo.com/falcon/landing/2026-09/falcon-wing.webp", width: 1672, height: 941, alt: "Falcon: управление тестированием" }],
  },
  twitter: { card: "summary_large_image", title: "Falcon: управление тестированием", description: "Тест-кейсы, прогоны и дефекты. Узнайте об интеграциях и подключении Falcon.", images: ["https://tms.saturnusgo.com/falcon/landing/2026-09/falcon-wing.webp"] },
};

export default function Page() {
  return <FalconLanding />;
}
