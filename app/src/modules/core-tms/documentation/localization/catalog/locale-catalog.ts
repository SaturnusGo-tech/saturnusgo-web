import type { TmsLocale } from "../../../localization/model/locale";
import { docArticles as englishArticles, docGroups as englishGroups } from "../../content/catalog";
import { docArticles as russianArticles, docGroups as russianGroups } from "../../content-ru/catalog";
import { visibleArticles } from "../../access/visible-articles";

function catalogs(locale: TmsLocale, articles: typeof englishArticles, docGroups: readonly { id: string; title: string }[]) {
  return [false, true].map(administrator => {
    const docArticles = visibleArticles(articles, administrator);
    return { locale, docGroups, docArticles, articleById: new Map(docArticles.map(article => [article.id, article])) };
  });
}
const byLocale = {
  en: catalogs("en", englishArticles, englishGroups),
  ru: catalogs("ru", russianArticles, russianGroups),
};

export function documentationCatalog(locale: TmsLocale, administrator: boolean) {
  return byLocale[locale][administrator ? 1 : 0];
}
