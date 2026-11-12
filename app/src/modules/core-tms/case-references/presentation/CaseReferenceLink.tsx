"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ProductDocSmartLink } from "../../product-docs/presentation/article/links/ProductDocSmartLink";
import { caseReferenceHref, readCaseReferenceMarker } from "../domain/caseReference";
import { useCaseReference } from "./CaseReferenceProvider";

export function CaseReferenceLink({ href, title, children, fallback }: {
  href?: string; title?: string; children?: ReactNode; fallback?: ReactNode;
}) {
  const key = readCaseReferenceMarker(href);
  const { reference, scope } = useCaseReference(key);
  const [origin, setOrigin] = useState<string>();
  useEffect(() => setOrigin(window.location.origin), []);
  if (!key) return <>{fallback ?? <ProductDocSmartLink href={href} title={title}>{children}</ProductDocSmartLink>}</>;
  if (!reference || !scope || !origin) return <>{children}</>;
  return <ProductDocSmartLink href={caseReferenceHref(reference, scope, origin)} title={reference.title}>
    {reference.title}
  </ProductDocSmartLink>;
}
