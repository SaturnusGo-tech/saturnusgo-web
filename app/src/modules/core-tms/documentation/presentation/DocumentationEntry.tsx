"use client";
import { useDocumentationCopy } from "../localization/useDocumentationCopy";
import dynamic from "next/dynamic";
import { ContentSkeleton } from "../../presentation/common/skeleton/ContentSkeleton";

function DocumentationLoading() {
  const copy = useDocumentationCopy();
  return <ContentSkeleton variant="article" label={copy.workspace} />;
}

export const DocumentationEntry = dynamic(() => import("./DocumentationView").then((module) => module.DocumentationView), {
  loading: DocumentationLoading,
});
