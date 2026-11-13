"use client";
import { ProjectDocumentation } from "./workspace/project/ProjectDocumentation";
import type { ProductDocsViewProps } from "./workspace/project/model/product-docs-view-props";

export function ProductDocsView(props: ProductDocsViewProps) {
  return <ProjectDocumentation key={JSON.stringify([props.scope.workspaceId, props.scope.projectId])} {...props} />;
}
