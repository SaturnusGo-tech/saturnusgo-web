"use client";

import { FileText, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { productDocErrorCode } from "../../domain/errors/product-doc-response";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocList } from "../../state/tree/useProductDocList";
import { ReadState } from "../status/ReadState";
import { ProductDocSectionIcon } from "../tree/appearance/ProductDocSectionIcon";
import shelf from "../tree/shelves/shelves.module.css";
import shared from "../product-docs.module.css";
import styles from "./archive.module.css";

export function ProductDocsArchive({ api, scope, copy, refresh, onChanged }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  refresh: number;
  onChanged(): void;
}) {
  const list = useProductDocList(api, scope, { archived: true, refresh });
  const heading = useId();
  const title = useRef<HTMLHeadingElement>(null);
  const pending = useRef(false);
  const [busy, setBusy] = useState<string>();
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, []);

  async function restore(node: ProductDocNode) {
    if (pending.current || list.loading || list.error) return;
    pending.current = true;
    setBusy(node.id);
    setNotice("");
    setFailure("");
    try {
      await api.setArchived(scope, node.id, false, { expectedDraftVersion: node.draftVersion });
      onChanged();
      setNotice(copy.restored);
      title.current?.focus({ preventScroll: true });
    } catch (error) {
      const code = productDocErrorCode(error);
      if (code === "PRODUCT_DOC_STALE_DRAFT") {
        setFailure(copy.lifecycleStale);
        onChanged();
      } else {
        setFailure(code === "PRODUCT_DOC_PARENT_ARCHIVED" ? copy.restoreParent : copy.restoreError);
      }
    } finally {
      pending.current = false;
      setBusy(undefined);
    }
  }

  const nodes = list.data?.nodes ?? [];
  return <section className={shelf.shelf} aria-labelledby={heading}>
    <div className={shelf.body}>
      <header className={shelf.intro}>
        <h1 id={heading} ref={title} tabIndex={-1}>{copy.archive}</h1>
        <p>{copy.archiveDescription}</p>
      </header>
      {notice && <p role="status">{notice}</p>}
      {failure && <p className={shared.error} role="alert">{failure}</p>}
      {nodes.length > 0 && <ul className={styles.list}>
        {nodes.map((node) => <li className={styles.row} key={node.id}>
          <span className={styles.label}>
            {node.kind === "folder" ? <ProductDocSectionIcon scope={scope} node={node} size={17} />
              : <FileText size={17} aria-hidden="true" />}
            <span>{node.title}</span>
          </span>
          {list.data?.canPublish && <button type="button" className={shared.action}
            aria-label={`${copy.restore} ${node.title}`} disabled={Boolean(busy) || list.loading || list.error}
            onClick={() => void restore(node)}>
            <RotateCcw size={14} aria-hidden="true" />{busy === node.id ? copy.saving : copy.restore}
          </button>}
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
