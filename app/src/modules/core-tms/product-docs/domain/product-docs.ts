import type { components } from "../../../../core/tms/generated/tms-api";

export interface ProductDocScope { workspaceId: string; projectId: string }
export interface ProductDocSelection { docId: string; version?: number; sectionId?: string }
export interface ProductDocNode {
  id: string;
  parentId: string | null;
  kind: "folder" | "page";
  title: string;
  draftVersion: number;
  publishedVersion: number | null;
}
export type ProductDocTitleHighlight = components["schemas"]["ProductDocTitleHighlight"];
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
  list(scope: ProductDocScope, options?: { q?: string; parentId?: string | null; draft?: boolean } & ProductDocPagination): Promise<ProductDocList>;
  get(scope: ProductDocScope, docId: string, options?: { version?: number; draft?: boolean; signal?: AbortSignal }): Promise<ProductDocDetail>;
  create(scope: ProductDocScope, input: {kind: ProductDocNode["kind"]; parentId: string | null; title: string}, options: {idempotencyKey: string; signal?: AbortSignal}): Promise<{id: string}>;
  save(scope: ProductDocScope, docId: string, input: {
    title: string; sections: ProductDocSection[]; expectedDraftVersion: number; titleHighlights?: ProductDocTitleHighlight[];
  }): Promise<{draftVersion: number}>;
  publish(scope: ProductDocScope, docId: string, input: {expectedDraftVersion: number}): Promise<{version: number}>;
  move(scope: ProductDocScope, docId: string, input: {parentId: string | null; expectedDraftVersion: number}): Promise<{draftVersion: number}>;
  listComments(scope: ProductDocScope, docId: string, options?: ProductDocPagination): Promise<ProductDocCommentPage>;
  postComment(scope: ProductDocScope, docId: string, body: string, options: { idempotencyKey: string }): Promise<ProductDocComment>;
  listArticleCases(scope: ProductDocScope, docId: string, options?: ProductDocPagination): Promise<{cases: ProductDocCase[]; nextCursor: string | null}>;
  listCaseRequirements(scope: ProductDocScope, caseId: string, options?: ProductDocPagination): Promise<ProductDocRequirements>;
  listRunRequirements(scope: ProductDocScope, runId: string, itemId: string, options?: ProductDocPagination): Promise<ProductDocRequirements>;
  linkRequirement(scope: ProductDocScope, caseId: string, docId: string, sectionId: string | null,
    options?: {preserveExisting: true}): Promise<{docId: string}>;
  unlinkRequirement(scope: ProductDocScope, caseId: string, docId: string): Promise<{docId: string}>;
}
