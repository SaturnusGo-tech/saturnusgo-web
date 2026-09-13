import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { docArticles as allArticles } from "../content/catalog";
import { visibleArticles } from "./visible-articles";

const catalogs = [false, true].map(administrator => {
  const docArticles = visibleArticles(allArticles, administrator);
  return { docArticles, articleById: new Map(docArticles.map(article => [article.id, article])) };
});

export function useDocumentationCatalog() {
  const session = useOptionalTmsSession();
  const administrator = session?.kind === "admin" || Boolean(session?.administrationPath);
  return catalogs[administrator ? 1 : 0];
}
