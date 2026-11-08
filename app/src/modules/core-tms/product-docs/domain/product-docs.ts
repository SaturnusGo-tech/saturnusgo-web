import type { ProductDocImpact } from "./impact/product-doc-impact";
import type { components } from "../../../../core/tms/generated/tms-api";
import type { FolderAppearance } from "../../folders/model/appearance/folder-appearance";
import type { ProductDocFilters, ProductDocSearchMatch, ProductDocTaxonomy, ProductDocTaxonomyInput } from "./product-doc-taxonomy";
import type { ProductDocProperties, ProductDocPropertiesInput } from "./properties/product-doc-properties";

export interface ProductDocScope { workspaceId: string; projectId: string }
export interface ProductDocSelection { docId: string; version?: number; sectionId?: string }
export interface ProductDocNode {
  id: string;
  parentId: string | null;
  kind: "folder" | "page";
  title: string;
  draftVersion: number;
  publishedVersion: number | null;
  archivedAt?: string | null;
  appearance?: FolderAppearance;
  taxonomy?: ProductDocTaxonomy;
  match?: ProductDocSearchMatch;
  searchPath?: readonly { id: string; title: string }[];
}
export type ProductDocTitleHighlight = components["schemas"]["ProductDocTitleHighlight"];
export type ProductDocLinkPreview = components["schemas"]["ProductDocLinkPreview"];
export interface ProductDocSection {
  id: string;
  title: string;
  markdown: string;
  titleHighlights?: ProductDocTitleHighlight[];
}
export interface ProductDocDetail extends ProductDocNode {
  sections: ProductDocSection[];
  version: number | null;
  canEdit: boolean;
  canPublish: boolean;
  titleHighlights?: ProductDocTitleHighlight[];
  properties?: ProductDocProperties;
  activity?: components["schemas"]["ProductDocDetail"]["activity"];
}
export interface ProductDocRequirement {
  docId: string;
  sectionId: string | null;
  title: string;
  sectionTitle: string | null;
  version: number;
}
export type DraftProductDocRequirement = Pick<ProductDocRequirement, "docId" | "sectionId" | "title" | "sectionTitle">;
export interface ProductDocCase { caseId: string; title: string; sectionId: string | null }
export interface ProductDocList {
  nodes: ProductDocNode[];
  nextCursor: string | null;
  canEdit: boolean;
  canPublish: boolean;
}
export interface ProductDocRequirements { requirements: ProductDocRequirement[]; canEdit: boolean; nextCursor: string | null }
export interface ProductDocComment {
  id: string;
  author: { identityId: string; displayName: string };
  body: string;
  createdAt: string;
}
export interface ProductDocCommentPage { comments: ProductDocComment[]; nextCursor: string | null; canComment: boolean }
export interface ProductDocPagination { limit?: number; cursor?: string; signal?: AbortSignal }
export interface ProductDocsApi {
  availability(scope: ProductDocScope, signal?: AbortSignal): Promise<boolean>;
  list(scope: ProductDocScope, options?: { q?: string; parentId?: string | null; draft?: boolean; archived?: boolean } & ProductDocPagination & ProductDocFilters): Promise<ProductDocList>;
  get(scope: ProductDocScope, docId: string, options?: { version?: number; draft?: boolean; archived?: boolean; signal?: AbortSignal }): Promise<ProductDocDetail>;
  create(scope: ProductDocScope, input: components["schemas"]["ProductDocCreateInput"],
    options: {idempotencyKey: string; signal?: AbortSignal}): Promise<{id: string}>;
  save(scope: ProductDocScope, docId: string, input: {
    title: string; sections: ProductDocSection[]; expectedDraftVersion: number; titleHighlights?: ProductDocTitleHighlight[];
    taxonomy?: ProductDocTaxonomyInput;
    properties?: ProductDocPropertiesInput;
  }): Promise<{draftVersion: number}>;
  publish(scope: ProductDocScope, docId: string, input: {expectedDraftVersion: number}): Promise<{version: number}>;
  move(scope: ProductDocScope, docId: string, input: {parentId: string | null; expectedDraftVersion: number}): Promise<{draftVersion: number}>;
  setArchived(scope: ProductDocScope, docId: string, archived: boolean, input: {
    expectedDraftVersion: number;
  }): Promise<{ draftVersion: number; archivedAt: string | null; affectedCount: number }>;
  setAppearance(scope: ProductDocScope, docId: string, input: {
    appearance: FolderAppearance; expectedDraftVersion: number;
  }): Promise<{ draftVersion: number }>;
  listComments(scope: ProductDocScope, docId: string, options?: ProductDocPagination): Promise<ProductDocCommentPage>;
  postComment(scope: ProductDocScope, docId: string, body: string, options: { idempotencyKey: string }): Promise<ProductDocComment>;
  getImpact(scope: ProductDocScope, docId: string, options?: ProductDocPagination & {
    draft?: boolean; expectedDraftVersion?: number; sectionId?: string;
  }): Promise<ProductDocImpact>;
  listArticleCases(scope: ProductDocScope, docId: string, options?: ProductDocPagination): Promise<{cases: ProductDocCase[]; nextCursor: string | null}>;
  listCaseRequirements(scope: ProductDocScope, caseId: string, options?: ProductDocPagination): Promise<ProductDocRequirements>;
  listRunRequirements(scope: ProductDocScope, runId: string, itemId: string, options?: ProductDocPagination): Promise<ProductDocRequirements>;
  linkRequirement(scope: ProductDocScope, caseId: string, docId: string, sectionId: string | null,
    options?: {preserveExisting: true}): Promise<{docId: string}>;
  unlinkRequirement(scope: ProductDocScope, caseId: string, docId: string): Promise<{docId: string}>;
}
