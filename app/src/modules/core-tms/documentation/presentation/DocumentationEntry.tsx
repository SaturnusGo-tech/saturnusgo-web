"use client";
import dynamic from "next/dynamic";
import { ContentSkeleton } from "../../presentation/common/skeleton/ContentSkeleton";

export const DocumentationEntry = dynamic(() => import("./DocumentationView").then((module) => module.DocumentationView), {
  loading: () => <ContentSkeleton variant="article" label="Falcon documentation" />,
});
