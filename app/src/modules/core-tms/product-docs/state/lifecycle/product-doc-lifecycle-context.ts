import type { TmsLocale } from "../../../localization/model/locale";
import type { ProductDocsCopy } from "../../localization/copy";
import type { ProductDocDraftBuffer } from "../draft/draft-buffer";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocLifecycleMode } from "../../domain/lifecycle/product-doc-lifecycle";

export interface ProductDocLifecycleContext {
  ownerId?: string;
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  drafts: ProductDocDraftBuffer;
  onCompleted(node: ProductDocNode, mode: ProductDocLifecycleMode, affectedDraftIds: readonly string[]): void;
  onChanged(): void;
}
