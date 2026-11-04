import type { Metadata } from "next";
import { CompanyEntryScreen } from "../../src/modules/core-falcon-public";

export const metadata: Metadata = {
  title: { absolute: "Создать личное пространство — Falcon" },
  description: "Личное пространство Falcon на семь дней.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CompanyEntryScreen signup />;
}
