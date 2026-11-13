import type { TmsLocale } from "../../../../../localization/model/locale";
import type { DraftProductDocRequirement, ProductDocScope, ProductDocSelection, ProductDocsApi } from "../../../../domain/product-docs";
import type { ProductDocDraftBuffer } from "../../../../state/draft/draft-buffer";

export interface ProductDocsViewProps {
  api: ProductDocsApi;
  scope: ProductDocScope;
  locale: TmsLocale;
  projectName?: string;
  drafts: ProductDocDraftBuffer;
  selection?: ProductDocSelection;
  onSelect(selection: ProductDocSelection | undefined): void;
  onOpenCase?: (location: { projectId: string; caseId: string }, selection?: ProductDocSelection) => void;
  onCreateCase?(requirement: DraftProductDocRequirement): void;
}
