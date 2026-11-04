import type { Metadata } from "next";
import { CompanyEntryScreen } from "../../src/modules/core-falcon-public";

export const metadata: Metadata = {
  title: { absolute: "Войти в Falcon" },
  description: "Вход в Falcon через Google, email или SAML SSO.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CompanyEntryScreen />;
}
