"use client";

import { useEffect, useState, type ComponentPropsWithoutRef } from "react";
import type { ExtraProps } from "react-markdown";
import { useProductDocsWorkspace } from "../../composition/context/ProductDocsContext";
import type { ProductDocDetail } from "../../domain/product-docs";
import { readScopedProductDocLink } from "../../navigation/product-doc-link";
import { ProductDocsMark } from "../../presentation/tree/empty/ProductDocsMark";
import { productDocLinkMetadata } from "./description-link-metadata";
import styles from "./description-link.module.css";

export function ProductDocDescriptionLink({href, children, node: _node, ...rest}: ComponentPropsWithoutRef<"a"> & ExtraProps) {
  const docs = useProductDocsWorkspace();
  const api = docs?.api;
  const scope = docs?.scope;
  const selection = href && scope && typeof window !== "undefined"
    ? readScopedProductDocLink(href, window.location.href, scope) : undefined;
  const {docId, version, sectionId} = selection ?? {};
  const [result, setResult] = useState<{scope: typeof scope; docId: string; version?: number; document: ProductDocDetail}>();

  useEffect(() => {
    if (!api || !scope || !docId) return;
    const controller = new AbortController();
    api.get(scope, docId, {version, signal: controller.signal}).then(document => {
      if (!controller.signal.aborted) {
        setResult({scope, docId, version, document});
      }
    }, () => {});
    return () => controller.abort();
  }, [api, scope, docId, version]);

  if (!docs || !selection || result?.scope !== scope || result?.docId !== docId || result?.version !== version || !result) {
    return <a href={href} {...rest}>{children}</a>;
  }
  const metadata = productDocLinkMetadata(result.document, {docId: selection.docId, version, sectionId});
  if (!metadata) return <a href={href} {...rest}>{children}</a>;
  return <a {...rest} className={[rest.className, styles.link].filter(Boolean).join(" ")} href={href}
    onClick={event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      docs.open(selection, event.currentTarget);
    }}>
    <ProductDocsMark />
    <span>{metadata.title}{metadata.sectionTitle && <small> · {metadata.sectionTitle}</small>}</span>
  </a>;
}
