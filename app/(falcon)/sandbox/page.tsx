import { CompanyAdministrationPage } from "../../src/modules/core-tms/company-administration/composition/CompanyAdministrationPage";

export const metadata = { title: { absolute: "Sandbox — Falcon" }, robots: { index: false, follow: false } };

export default function Page() {
  return <CompanyAdministrationPage section="sandbox" />;
}
