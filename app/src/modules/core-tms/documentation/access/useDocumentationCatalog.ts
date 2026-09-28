import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { documentationCatalog } from "../localization/catalog/locale-catalog";

export function useDocumentationCatalog() {
  const session = useOptionalTmsSession();
  const { locale } = useTmsLocale();
  const administrator = session?.kind === "admin" || Boolean(session?.administrationPath);
  return documentationCatalog(locale, administrator);
}
