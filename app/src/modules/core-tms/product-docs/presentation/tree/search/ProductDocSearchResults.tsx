"use client";

import { Skeleton } from "@heroui/react";
import { useEffect, useState } from "react";
import type { ProductDocTaxonomy } from "../../../domain/product-doc-taxonomy";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import type { ProductDocsCopy } from "../../../localization/copy";
import { useProductDocList } from "../../../state/tree/useProductDocList";
import { ReadState } from "../../status/ReadState";
import styles from "../../product-docs.module.css";
import treeStyles from "../product-docs-tree.module.css";
import resultStyles from "./search-results.module.css";

export function ProductDocSearchResults({ api, scope, copy, query, taxonomy, refresh, onChoose }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  query: string;
  taxonomy: ProductDocTaxonomy;
  refresh: number;
  onChoose(node: ProductDocNode): void;
}) {
  const desiredQuery = query.trim();
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(desiredQuery), desiredQuery ? 180 : 0);
    return () => window.clearTimeout(timer);
  }, [desiredQuery]);
  const { data, loading, error, retry, more } = useProductDocList(api, scope, {
    q: desiredQuery || undefined, refresh, enabled: search === desiredQuery,
    productGroupId: taxonomy.productGroup?.id, productId: taxonomy.product?.id,
  });

  const waitingForResults = !data && loading;

  return <>
    <div role="status" className={resultStyles.status}>{waitingForResults ? copy.loading : ""}</div>
    <div className={resultStyles.results} data-doc-search-results aria-busy={loading}>
      {waitingForResults && <div className={resultStyles.placeholder} aria-hidden="true">
        {[0, 1, 2].map((row) => <div key={row}><Skeleton className={resultStyles.skeleton} disableAnimation /><Skeleton className={resultStyles.skeleton} disableAnimation /></div>)}
      </div>}
      {error && !data?.nodes.length && <ReadState copy={copy} status="error" retry={retry} />}
      {data && !error && data.nodes.length === 0 && <p className={styles.treeEmpty}>{copy.noResults}</p>}
      {!!data?.nodes.length && <ul className={`${treeStyles.branch} ${resultStyles.reveal}`}>
        {data.nodes.map((node) => {
          const location = node.searchPath?.map(({ title }) => title).join(" / ");
          return <li key={node.id}>
            <button type="button" className={resultStyles.result} onClick={() => onChoose(node)}>
              {location && <span className={resultStyles.path} title={location}>{location}</span>}
              <strong>{node.title}</strong>
              {node.match?.sectionTitle && <span>{node.match.sectionTitle}</span>}
              {node.match?.kind === "body" && <span className={resultStyles.snippet}>{node.match.snippet}</span>}
            </button>
          </li>;
        })}
      </ul>}
      {error && !!data?.nodes.length && <button type="button" className={styles.action} onClick={retry}>{copy.retry}</button>}
      {data?.nextCursor && !error && <button type="button" className={styles.action} disabled={loading} onClick={more}>{copy.more}</button>}
    </div>
  </>;
}
