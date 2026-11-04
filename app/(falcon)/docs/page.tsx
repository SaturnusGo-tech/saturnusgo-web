import type { Metadata } from "next";
import { PublicDocumentation } from "../../src/modules/core-falcon-public/documentation/PublicDocumentation";
import { publicDocumentationCatalog } from "../../src/modules/core-falcon-public/documentation/catalog";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn how to organize test cases, prepare runs, record results and connect your team's tools in Falcon.",
  alternates: { canonical: "/docs/", languages: { en: "/docs/", ru: "/ru/docs/" } },
  robots: { index: true, follow: true },
};

export default function DocsPage() {
  return <PublicDocumentation {...publicDocumentationCatalog("en")} locale="en" />;
}
