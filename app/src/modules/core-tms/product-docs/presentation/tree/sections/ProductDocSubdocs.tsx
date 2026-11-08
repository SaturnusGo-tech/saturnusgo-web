"use client";

import { Button } from "@heroui/react";
import type { ReactNode } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import type { ProductDocsCopy } from "../../../localization/copy";
import { useProductDocList } from "../../../state/tree/useProductDocList";
import { ProductDocsDirectory } from "../ProductDocsOverview";
import styles from "./section-contents.module.css";

export function ProductDocSubdocs({ api, scope, parentId, copy, locale, refresh, draft, createPage, onOpen }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  parentId: string;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  refresh: number;
  draft: boolean;
  createPage?: ReactNode;
  onOpen(node: ProductDocNode): void;
}) {
  const { data, loading, error, retry, more } = useProductDocList(api, scope, { parentId, refresh, draft });
  const label = locale === "ru" ? "Подстраницы" : "Subdocs";
  if (!createPage && !data?.nodes.length && !error) return null;
  return <section aria-label={label} className={styles.subdocs}>
    {!!data?.nodes.length && <>
      <h2>{label}</h2>
      <ProductDocsDirectory scope={scope} nodes={data.nodes} copy={copy} locale={locale} showPagesHeading={false} onOpen={onOpen} />
    </>}
    {createPage}
    {(error || data?.nextCursor) && <Button size="sm" variant="light" onPress={error ? retry : more} isDisabled={loading}>
      {error ? copy.retry : copy.more}
    </Button>}
  </section>;
}
