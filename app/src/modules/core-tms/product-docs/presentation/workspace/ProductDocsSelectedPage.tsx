"use client";

import type { ReactNode, RefObject } from "react";
import type { TmsLocale } from "../../../localization/model/locale";
import type { ProductDocDetail, ProductDocNode, ProductDocScope, ProductDocSelection, ProductDocsApi } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import type { ProductDocDraftBuffer } from "../../state/draft/draft-buffer";
import { ProductDocActivity } from "../activity/ProductDocActivity";
import { ProductDocRelatedCases } from "../related-cases/ProductDocRelatedCases";
import { ProductDocArticle } from "../article/ProductDocArticle";
import { ProductDocDraft, type RequestNewProductDoc } from "../draft/ProductDocDraft";
import { ProductDocSectionContents } from "../tree/sections/ProductDocSectionContents";

export function ProductDocsSelectedPage({ api, scope, locale, copy, page, selection, editing, projectName,
  drafts, editorActionsRef, requestNewPageRef, refresh, canEdit, starred, folderCreation, subdocs, context,
  onCloseDraft, onSaved, onOpen, onSelectSection, onOpenCase }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  locale: TmsLocale;
  copy: ProductDocsCopy;
  page: ProductDocDetail;
  selection: ProductDocSelection;
  editing: boolean;
  projectName?: string;
  drafts: ProductDocDraftBuffer;
  editorActionsRef: RefObject<HTMLDivElement | null>;
  requestNewPageRef: RefObject<RequestNewProductDoc | null>;
  refresh: number;
  canEdit: boolean;
  starred: readonly string[];
  folderCreation?: ReactNode;
  subdocs?: ReactNode;
  context?: ReactNode;
  onCloseDraft(published?: boolean): void;
  onSaved(): void;
  onOpen(node: ProductDocNode): void;
  onSelectSection(sectionId: string): void;
  onOpenCase?(location: { projectId: string; caseId: string }): void;
}) {
  const articleFooter = page.kind === "page" && selection.version === undefined && !page.archivedAt ? <>
    {subdocs}
    <ProductDocActivity key={`activity:${page.id}`} api={api} scope={scope} document={page} locale={locale} copy={copy} />
  </> : subdocs;
  if (editing) return <ProductDocDraft key={page.id} api={api} scope={scope} document={page} locale={locale}
    copy={copy} projectName={projectName ?? copy.title} subdocs={articleFooter} drafts={drafts}
    editorActionsRef={editorActionsRef} requestNewPageRef={requestNewPageRef}
    onClose={() => onCloseDraft()} onPublished={() => onCloseDraft(true)} onSaved={onSaved} onOpenCase={onOpenCase} />;
  if (page.kind === "folder") return <ProductDocSectionContents api={api} scope={scope} node={page}
    copy={copy} locale={locale} refresh={refresh} draft={canEdit} starred={starred} onOpen={onOpen} createPage={folderCreation} />;
  return <ProductDocArticle key={page.id + ":" + page.version} document={page} scope={scope} copy={copy}
    versionPinned={selection.version !== undefined} sectionId={selection.sectionId} projectName={projectName}
    locale={locale} subdocs={articleFooter} onSelectSection={onSelectSection} context={context}
    relatedCases={<ProductDocRelatedCases api={api} scope={scope} document={page} locale={locale} projectName={projectName} onOpenCase={onOpenCase} />} />;
}
