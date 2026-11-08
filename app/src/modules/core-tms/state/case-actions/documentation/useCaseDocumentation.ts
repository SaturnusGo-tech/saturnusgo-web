import { useRef, useState } from "react";
import type { TestCaseRevision } from "../../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import type { TmsLocale } from "../../../localization/model/locale";
import { createProductDocsApi } from "../../../product-docs/data/product-docs-api";
import type { DraftProductDocRequirement, ProductDocScope } from "../../../product-docs/domain/product-docs";
import { saveDraftRequirements } from "../../../product-docs/requirements/save/save-draft-requirements";
import { pastedCaseDocLinks } from "../../../product-docs/requirements/save/pasted/pasted-case-doc-links";
import { savePastedRequirements } from "../../../product-docs/requirements/save/pasted/save-pasted-requirements";
import { notifyCaseRequirementsChanged } from "../../../product-docs/requirements/save/case-requirements-events";

export function useCaseDocumentation(http: TmsHttpClient, locale: TmsLocale, notify: (message: string) => void) {
  const [caseDocumentation, setCaseDocumentation] = useState<readonly DraftProductDocRequirement[]>([]);
  const [caseDocumentationRetry, setCaseDocumentationRetry] = useState(false);
  const applied = useRef(new Map<string, string | null | undefined>());
  return {
    fields: {caseDocumentation, setCaseDocumentation, caseDocumentationRetry},
    reset(requirements: readonly DraftProductDocRequirement[] = []) {
      setCaseDocumentation(requirements);
      setCaseDocumentationRetry(false);
      applied.current.clear();
    },
    async save(scope: ProductDocScope, caseId: string, revision: TestCaseRevision, editing: boolean) {
      const hasManualChanges = !editing && Boolean(caseDocumentation.length || applied.current.size);
      const pasted = typeof window === "undefined" ? [] : pastedCaseDocLinks(revision, window.location.href, scope);
      if (!hasManualChanges && !pasted.length) return true;
      try {
        const api = createProductDocsApi(http);
        if (hasManualChanges) await saveDraftRequirements(api, scope, caseId, caseDocumentation, applied.current);
        await savePastedRequirements(api, scope, caseId, pasted);
        return true;
      } catch (caught) {
        setCaseDocumentationRetry(true);
        const failure = toTmsMutationFailure(caught);
        if (failure.code === "PRODUCT_DOC_NOT_FOUND") {
          notify(locale === "ru" ? "Кейс сохранён. Выберите доступную статью или уберите устаревшую ссылку перед повторным сохранением."
            : "The case was saved. Choose an available article or remove the outdated link before saving again.");
          return false;
        }
        notify(formatTmsMutationFailure(failure, locale === "ru"
          ? "Кейс сохранён. Повторите сохранение, чтобы привязать оставшиеся статьи."
          : "The case was saved. Save again to link the remaining pages."));
        return false;
      } finally {
        notifyCaseRequirementsChanged(scope, caseId);
      }
    },
  };
}
