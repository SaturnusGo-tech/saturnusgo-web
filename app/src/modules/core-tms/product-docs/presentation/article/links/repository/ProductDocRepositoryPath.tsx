"use client";

import type { ReactNode } from "react";
import { useProductDocsWorkspace } from "../../../../composition/context/ProductDocsContext";
import { repositoryPath } from "../../../../navigation/product-doc-smart-link";
import { useProductDocLinkPreview } from "../../../../state/links/useProductDocLinkPreview";
import { ProductDocSmartLink } from "../ProductDocSmartLink";

/** Existing inline-code paths become breadcrumbs only after an exact authorized folder match. */
export function ProductDocRepositoryPath({children}: {children?: ReactNode}) {
  const workspace = useProductDocsWorkspace();
  const text = typeof children === "string" ? children : undefined;
  const path = text?.includes("/") ? repositoryPath(text) : undefined;
  const href = path && workspace ? `/work/?${new URLSearchParams({...workspace.scope, view: "cases", folderPath: path})}` : undefined;
  const {preview} = useProductDocLinkPreview(href);
  return href && preview?.kind === "repository" ? <ProductDocSmartLink href={href}>{text}</ProductDocSmartLink> : <code>{children}</code>;
}
