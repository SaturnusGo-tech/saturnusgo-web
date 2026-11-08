import type { TmsLocale } from "../../../../../localization/model/locale";
import { productDocErrorCode } from "../../../../domain/errors/product-doc-response";
import type { ProductDocsCopy } from "../../../../localization/copy";

export function productDocSaveError(error: unknown, copy: ProductDocsCopy, locale: TmsLocale): string {
  switch (productDocErrorCode(error)) {
    case "PRODUCT_DOC_STALE_DRAFT": return copy.staleDraft;
    case "PRODUCT_DOC_PARENT_UNPUBLISHED": return copy.unpublishedParent;
    case "PRODUCT_DOC_INVALID_TAXONOMY":
      return locale === "ru" ? "Выберите актуальные значения из каталога проекта." : "Choose current values from the project catalog.";
    case "PRODUCT_DOC_ASSIGNEE_UNAVAILABLE":
      return locale === "ru" ? "Выберите действующего участника рабочего пространства." : "Choose an active workspace member.";
    default: return copy.saveError;
  }
}
