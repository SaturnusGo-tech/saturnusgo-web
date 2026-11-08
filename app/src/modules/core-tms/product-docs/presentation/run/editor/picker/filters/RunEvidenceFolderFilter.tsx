"use client";

import { BreadcrumbItem, Breadcrumbs, Button } from "@heroui/react";
import { Check, ChevronRight, Folder } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { RunEvidenceFilterSearch, type FilterOption } from "./RunEvidenceFilterOptions";
import styles from "./run-filter-popover.module.css";

const root = "/";

function segments(path: string) {
  return path.split("/").filter(Boolean);
}

export function RunEvidenceFolderFilter({ options, selected, onChange, ru, loading }: {
  options: readonly FilterOption[]; selected: string[]; onChange(values: string[]): void; ru: boolean; loading: boolean;
}) {
  const [folder, setFolder] = useState(root);
  const [search, setSearch] = useState("");
  const page = useRef<HTMLDivElement>(null);
  const term = search.trim().toLocaleLowerCase();
  const lineage = segments(folder);
  const crumbs = [{ id: root, label: ru ? "Все папки" : "All folders" }, ...lineage.map((label, index) => ({
    id: `/${lineage.slice(0, index + 1).join("/")}`, label,
  }))];
  const { entries, parents } = useMemo(() => {
    const folders = new Map<string, { id: string; parent: string; name: string; ancestors: string[]; value: string }>();
    const parents = new Set<string>();
    for (const { value } of options) {
      const parts = segments(value);
      parts.forEach((name, index) => {
        const id = `/${parts.slice(0, index + 1).join("/")}`;
        const parent = `/${parts.slice(0, index).join("/")}`;
        parents.add(parent);
        if (index === parts.length - 1 || !folders.has(id)) {
          folders.set(id, { id, parent, name, ancestors: parts.slice(0, index), value: index === parts.length - 1 ? value : id });
        }
      });
    }
    return { entries: [...folders.values()], parents };
  }, [options]);
  const rows = entries.filter((entry) => term ? `${entry.ancestors.join(" ")} ${entry.name}`.toLocaleLowerCase().includes(term)
    : entry.parent === folder);
  const open = (id: string) => {
    setFolder(id);
    setSearch("");
    requestAnimationFrame(() => {
      const first = page.current?.querySelector<HTMLElement>("[data-folder-filter-option]")
        ?? page.current?.querySelector<HTMLInputElement>("input");
      first?.focus({ preventScroll: true });
    });
  };

  return <div ref={page}>
    <RunEvidenceFilterSearch label={ru ? "Найти папку" : "Find a folder"} value={search} onChange={setSearch} />
    {folder !== root && !term && <Breadcrumbs aria-label={ru ? "Путь к папке" : "Folder path"} size="sm" itemsBeforeCollapse={1} itemsAfterCollapse={2}
      classNames={{ base: styles.breadcrumbs, list: styles.trail }}
      itemClasses={{ base: styles.crumb, item: styles.crumbAction, separator: styles.separator }}>
      {crumbs.map(({ id, label }) => <BreadcrumbItem key={id} isCurrent={id === folder}
        onPress={id === folder ? undefined : () => open(id)}>{label}</BreadcrumbItem>)}
    </Breadcrumbs>}
    <ul className={styles.list} aria-label={ru ? "Папки" : "Folders"}>
      {rows.map((entry) => {
        const checked = selected.includes(entry.value);
        return <li key={entry.id} className={styles.folderRow}>
          <Button variant="light" disableRipple className={styles.row} aria-pressed={checked} data-folder-filter-option
            aria-label={entry.name} aria-description={term && entry.ancestors.length > 0 ? entry.ancestors.join(", ") : undefined}
            onPress={() => onChange(checked ? selected.filter((value) => value !== entry.value) : [...selected, entry.value])}
            startContent={<Folder size={14} aria-hidden="true" />} endContent={checked ? <Check size={14} aria-hidden="true" /> : undefined}>
            <span className={styles.optionLabel}>{entry.name}</span>
            {term && entry.ancestors.length > 0 && <span aria-hidden="true" className={styles.detail}>
              {entry.ancestors.join(" › ")}
            </span>}
          </Button>
          {parents.has(entry.id) && <Button isIconOnly variant="light" disableRipple className={styles.disclosure}
            aria-label={ru ? `Открыть подпапки «${entry.name}»` : `Open subfolders of ${entry.name}`}
            onPress={() => open(entry.id)}>
            <ChevronRight size={14} aria-hidden="true" />
          </Button>}
        </li>;
      })}
    </ul>
    {folder === root && selected.length > 0 && !term && <Button className={styles.action} onPress={() => onChange([])}>
      {ru ? "Сбросить выбор папок" : "Clear folder selection"}
    </Button>}
    {!loading && !rows.length && <p className={styles.note}>{term ? (ru ? "Совпадений нет." : "No matching folders.")
      : (ru ? "Нет папок." : "No folders.")}</p>}
  </div>;
}
