"use client";

import { FileText } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocList } from "../../state/tree/useProductDocList";
import { ReadState } from "../status/ReadState";
import { ProductDocSectionIcon } from "../tree/appearance/ProductDocSectionIcon";
import shelf from "../tree/shelves/shelves.module.css";
import styles from "./archive.module.css";
import { ProductDocItemMenu } from "../lifecycle/menu/ProductDocItemMenu";
import type { ProductDocLifecycleContext } from "../../state/lifecycle/product-doc-lifecycle-context";

export function ProductDocsArchive({ api, scope, copy, refresh, lifecycle }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  refresh: number;
  onChanged(): void;
  lifecycle?: ProductDocLifecycleContext;
}) {
  const list = useProductDocList(api, scope, { archived: true, refresh });
  const heading = useId();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, []);

  const nodes = list.data?.nodes ?? [];
  return <section className={shelf.shelf} aria-labelledby={heading}>
    <div className={shelf.body}>
      <header className={shelf.intro}>
        <h1 id={heading} ref={title} tabIndex={-1}>{copy.archive}</h1>
        <p>{copy.archiveDescription}</p>
      </header>
      {nodes.length > 0 && <ul className={styles.list}>
        {nodes.map((node) => <li className={styles.row} key={node.id}>
          <span className={styles.label}>
            {node.kind === "folder" ? <ProductDocSectionIcon scope={scope} node={node} size={17} />
              : <FileText size={17} aria-hidden="true" />}
            <span>{node.title}</span>
          </span>
          {lifecycle && <ProductDocItemMenu context={lifecycle} node={node} permissions={list.data ?? {}}
            disabled={list.loading || list.error} />}
        </li>)}
      </ul>}
      {list.error || (list.loading && !nodes.length)
        ? <ReadState copy={copy} status={list.error ? "error" : "loading"} retry={list.retry} />
        : !nodes.length && <p>{copy.archiveEmpty}</p>}
      {!list.error && list.data?.nextCursor && <button type="button" className={shelf.more} disabled={list.loading} onClick={list.more}>
        {copy.more}
      </button>}
    </div>
  </section>;
}
