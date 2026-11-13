import type { ReactNode, RefObject } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocDetail, ProductDocScope, ProductDocsApi } from "../../../domain/product-docs";
import type { ProductDocsCopy } from "../../../localization/copy";
import type { ProductDocDraftBuffer } from "../../../state/draft/draft-buffer";
import type { ProductDocLifecycleContext } from "../../../state/lifecycle/product-doc-lifecycle-context";

export type RequestNewProductDoc = (create: () => void) => void;
export interface ProductDocDraftProps {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  copy: ProductDocsCopy;
  projectName: string;
  subdocs?: ReactNode;
  locale: TmsLocale;
  lifecycle?: ProductDocLifecycleContext;
  onClose(): void;
  onSaved(): void;
  onPublished(): void;
  onOpenCase?(location: { projectId: string; caseId: string }): void;
  drafts: ProductDocDraftBuffer;
  editorActionsRef?: RefObject<HTMLDivElement | null>;
  requestNewPageRef?: RefObject<RequestNewProductDoc | null>;
}
