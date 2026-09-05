import type { Metadata } from "next";
import { FalconLanding } from "../src/modules/core-falcon-public";

export const metadata: Metadata = {
  title: { absolute: "Falcon — управление тестированием и качеством продукта" },
  description: "Тест-кейсы, запуски, дефекты и аналитика качества в едином рабочем пространстве Falcon.",
  openGraph: {
    title: "Falcon — управление качеством продукта",
    description: "Единое пространство для ручного и автоматизированного тестирования.",
    url: "https://tms.saturnusgo.com/",
    siteName: "Falcon",
  },
};

export default function Page() {
  return <FalconLanding />;
}
