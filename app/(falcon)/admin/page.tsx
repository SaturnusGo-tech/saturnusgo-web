import { CompanyAdministrationPage } from "../../src/modules/core-tms/company-administration/composition/CompanyAdministrationPage";

export const metadata = { title: { absolute: "Управление компанией — Falcon" }, robots: { index: false, follow: false } };

export default function Page() {
  return <CompanyAdministrationPage section="admin" />;
}
