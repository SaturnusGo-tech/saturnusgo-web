"use client";

import { BreadcrumbItem, useBreadcrumbs } from "@heroui/breadcrumbs";
import { ChevronRight } from "lucide-react";
import styles from "../smart-link.module.css";

// The inline composition uses HeroUI's breadcrumb hook/items without a nav/ol inside a prose paragraph.
export function ProductDocRepositoryBreadcrumbs({path}: {path: readonly string[]}) {
  const {getListProps} = useBreadcrumbs({size: "sm", classNames: {list: styles.breadcrumbList}});
  return <span {...getListProps()} role="list" className={styles.breadcrumbList}>
    {path.map((part, index) => <BreadcrumbItem key={`${index}:${part}`} as="span" role="listitem"
      isCurrent={index === path.length - 1} isLast={index === path.length - 1} disableAnimation
      separator={<ChevronRight size={11} aria-hidden="true" />} classNames={{base: styles.breadcrumbItem, item: styles.breadcrumbLabel, separator: styles.breadcrumbSeparator}}>
      {part}
    </BreadcrumbItem>)}
  </span>;
}
