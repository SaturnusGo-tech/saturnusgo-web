"use client";

import { Button } from "@heroui/react";
import { PanelLeft } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { WorkspaceBreadcrumbs } from "../../../presentation/common/breadcrumbs/WorkspaceBreadcrumbs";
import type { ProductDocNode } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import styles from "../product-docs.module.css";

export function ProductDocsWorkspaceHeader({ copy, projectName, path, currentTitle, navigation, actions,
  onHome, onSelect }: {
  copy: ProductDocsCopy;
  projectName?: string;
  path?: readonly ProductDocNode[];
  currentTitle: string;
  navigation?: { button: RefObject<HTMLButtonElement | null>; id: string; open: boolean; toggle(): void };
  actions?: ReactNode;
  onHome(): void;
  onSelect(node: ProductDocNode): void;
}) {
  return <header className={styles.topbar}>
    {navigation && <Button ref={navigation.button} isIconOnly variant="light" size="sm" className={styles.mobileTree}
      aria-label={copy.browse} aria-expanded={navigation.open} aria-controls={navigation.id} onPress={navigation.toggle}>
      <PanelLeft size={17} aria-hidden="true" />
    </Button>}
    <WorkspaceBreadcrumbs label={copy.title} overflowLabel={copy.pathAncestors} items={[
      { id: "root", label: projectName || copy.title, onPress: onHome },
      ...(path ?? []).map((ancestor) => ({ id: ancestor.id, label: ancestor.title, onPress: () => onSelect(ancestor) })),
      { id: "current", label: currentTitle },
    ]} />
    {actions}
  </header>;
}
