import type { Metadata } from "next";
import { CompanyEntryScreen } from "../../src/modules/core-falcon-public";

export const metadata: Metadata = {
  title: { absolute: "Войти в компанию — Falcon" },
  description: "Вход в Falcon по адресу вашей компании.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CompanyEntryScreen redirectSignup />;
}
