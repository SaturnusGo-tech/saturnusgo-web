"use client";

import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import type { ProductDocsCopy } from "../../../localization/copy";
import { useProductDocList } from "../../../state/tree/useProductDocList";
import shared from "../../product-docs.module.css";
import { ReadState } from "../../status/ReadState";
import { ProductDocSectionIcon } from "../appearance/ProductDocSectionIcon";
import { ProductDocsDirectory } from "../ProductDocsOverview";
import styles from "./section-contents.module.css";

export function ProductDocSectionContents({ api, scope, node, copy, locale, refresh, draft, starred, onOpen }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  node: ProductDocNode;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  refresh: number;
  draft: boolean;
  starred: readonly string[];
  onOpen(node: ProductDocNode): void;
}) {
  const { data, loading, error, retry, more } = useProductDocList(api, scope, { parentId: node.id, refresh, draft });
  return <div className={styles.section}>
    <header className={styles.heading}>
      <ProductDocSectionIcon scope={scope} node={node} size={28} />
      <h1>{node.title}</h1>
    </header>
    {(!data || (error && !data.nodes.length))
      ? <ReadState copy={copy} status={error ? "error" : "loading"} retry={retry} />
      : data.nodes.length > 0
        ? <ProductDocsDirectory scope={scope} nodes={data.nodes} copy={copy} locale={locale} starred={starred} onOpen={onOpen} />
        : <p className={styles.empty}>{copy.noPages}</p>}
    {data?.nextCursor && <button type="button" className={shared.action} disabled={loading} onClick={error ? retry : more}>
      {error ? copy.retry : copy.more}
    </button>}
  </div>;
}
