import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import css from "./folder-path-breadcrumb.module.css";

export function FolderPathBreadcrumb({ path, ru, rootLabel }: { path: string; ru: boolean; rootLabel?: string }) {
  const viewport = useRef<HTMLSpanElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);
  const segments = path.split("/").filter(Boolean);
  const labels = rootLabel ? [rootLabel, ...segments] : segments.length ? segments : [ru ? "Корень проекта" : "Project root"];
  useEffect(() => {
    const measure = () => setDistance(Math.max(0, (content.current?.scrollWidth ?? 0) - (viewport.current?.clientWidth ?? 0)));
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (content.current) observer.observe(content.current);
    measure();
    return () => observer.disconnect();
  }, [path, ru, rootLabel]);
  return <span ref={viewport} className={css.viewport} data-folder-breadcrumb data-overflow={distance > 1}
    style={{ "--path-distance": `${-distance}px`, "--path-duration": `${Math.max(4, distance / 35 + 2)}s` } as CSSProperties}>
    <span className={css.accessible}>{labels.join(" › ")}</span>
    <span ref={content} className={css.content}>
      <Breadcrumbs aria-hidden="true" isDisabled size="sm" maxItems={labels.length + 1}
        separator={<ChevronRight size={12} aria-hidden="true" />} classNames={{ base: css.breadcrumbs, list: css.list }}
        itemClasses={{ base: css.crumb, item: css.item, separator: css.separator }}>
        {labels.map((label, index) => <BreadcrumbItem key={`${index}:${label}`} isCurrent={index === labels.length - 1}>{label}</BreadcrumbItem>)}
      </Breadcrumbs>
    </span>
  </span>;
}
