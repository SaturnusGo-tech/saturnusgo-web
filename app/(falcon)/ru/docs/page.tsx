import type { Metadata } from "next";
import { PublicDocumentation } from "../../../src/modules/core-falcon-public/documentation/PublicDocumentation";
import { publicDocumentationCatalog } from "../../../src/modules/core-falcon-public/documentation/catalog";

export const metadata: Metadata = {
  title: "Документация",
  description: "Как организовать тест-кейсы, подготовить прогоны, записать результаты и подключить инструменты команды в Falcon.",
  alternates: { canonical: "/ru/docs/", languages: { en: "/docs/", ru: "/ru/docs/" } },
  robots: { index: true, follow: true },
};

export default function DocsPage() {
  return <PublicDocumentation {...publicDocumentationCatalog("ru")} locale="ru" />;
}
