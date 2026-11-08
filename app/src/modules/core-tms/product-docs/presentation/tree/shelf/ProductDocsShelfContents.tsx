"use client";

import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import type { ProductDocsCopy } from "../../../localization/copy";
import type { ProductDocsShelf } from "../../../state/library/useProductDocsLibrary";
import type { useProductDocList } from "../../../state/tree/useProductDocList";
import { ProductDocsArchive } from "../../archive/ProductDocsArchive";
import { ReadState } from "../../status/ReadState";
import { ProductDocsOverview } from "../ProductDocsOverview";

export function ProductDocsShelfContents({ api, scope, copy, locale, projectName, shelf, project,
  recent, starred, canArchive, refresh, onChanged, onOpen, onBrowseRecent }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  projectName?: string;
  shelf: ProductDocsShelf;
  project: ReturnType<typeof useProductDocList>;
  recent: readonly string[];
  starred: readonly string[];
  canArchive: boolean;
  refresh: number;
  onChanged(): void;
  onOpen(node: ProductDocNode): void;
  onBrowseRecent(): void;
}) {
  if (shelf === "archive" && canArchive) return <ProductDocsArchive api={api} scope={scope} copy={copy} refresh={refresh} onChanged={onChanged} />;
  if (!project.data || (project.error && !project.data.nodes.length)) {
    return <ReadState copy={copy} status={project.loading ? "loading" : "error"} retry={project.retry} />;
  }
  if (shelf === "archive") return null;
  return <ProductDocsOverview api={api} scope={scope} copy={copy} locale={locale} projectName={projectName}
    shelf={shelf} rootNodes={project.data.nodes} recent={recent} starred={starred} onOpen={onOpen} onBrowseRecent={onBrowseRecent}
    onMoreRoot={project.data.nextCursor ? (project.error ? project.retry : project.more) : undefined} loadingMoreRoot={project.loading} />;
}
