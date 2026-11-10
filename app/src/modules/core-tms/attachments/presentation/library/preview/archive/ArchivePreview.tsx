"use client";

import { Button } from "@heroui/react";
import { ChevronRight, File, FileArchive, FileCode, Folder, FolderOpen } from "lucide-react";
import { lazy, Suspense, useEffect, useId, useMemo, useState } from "react";
import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import { WorkspaceBreadcrumbs } from "../../../../../presentation/common/breadcrumbs/WorkspaceBreadcrumbs";
import type { ArchiveEntry, ParsedFilePreview } from "../model/file-preview-format";
import styles from "../attachment-file-preview.module.css";

const SourceFilePreview = lazy(() => import("../source/SourceFilePreview"));
type ArchiveNode = { path: string; label: string; directory: boolean; entry?: ArchiveEntry };
type Source = Extract<ParsedFilePreview, { kind: "text" }>;
type OpenEntry = (entry: ArchiveEntry, signal: AbortSignal) => Promise<Source>;

function archiveIndex(entries: ArchiveEntry[], locale: string) {
  const nodes = new Map<string, ArchiveNode>();
  const children = new Map<string, ArchiveNode[]>();
  for (const entry of entries) {
    const parts = entry.name.replace(/\/$/, "").split("/");
    let parent = "";
    for (const [index, label] of parts.entries()) {
      const directory = index < parts.length - 1 || entry.directory;
      const path = parent + label + (directory ? "/" : "");
      if (!nodes.has(path)) {
        const node = { path, label, directory, entry: directory ? undefined : entry };
        nodes.set(path, node);
        const siblings = children.get(parent) ?? [];
        siblings.push(node);
        children.set(parent, siblings);
      }
      parent = path;
    }
  }
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  for (const siblings of children.values()) {
    siblings.sort((a, b) => Number(b.directory) - Number(a.directory) || collator.compare(a.label, b.label));
  }
  return { nodes, children };
}

function entrySize(bytes: number, ru: boolean) {
  const power = bytes >= 1024 ** 2 ? 2 : bytes >= 1024 ? 1 : 0;
  const unit = (ru ? ["Б", "КБ", "МБ"] : ["B", "KB", "MB"])[power];
  return `${new Intl.NumberFormat(ru ? "ru" : "en", { maximumFractionDigits: 1 }).format(bytes / 1024 ** power)} ${unit}`;
}

function ArchiveTreeRow({ node, depth, childrenByPath, expanded, current, onOpen }: {
  node: ArchiveNode; depth: number; childrenByPath: Map<string, ArchiveNode[]>;
  expanded: Set<string>; current: string; onOpen: (path: string, toggle?: boolean) => void;
}) {
  const groupId = useId();
  const opened = expanded.has(node.path);
  const Icon = node.directory ? opened ? FolderOpen : Folder : node.entry?.previewable ? FileCode : File;
  const children = childrenByPath.get(node.path);
  return <li>
    <Button size="sm" variant="light" disableRipple className={styles.treeRow} onPress={() => onOpen(node.path, node.directory)}
      aria-current={current === node.path ? "location" : undefined}
      aria-expanded={node.directory ? opened : undefined} aria-controls={opened && children?.length ? groupId : undefined}
      style={{ paddingInlineStart: 8 + Math.min(depth, 10) * 14 }} title={node.label}>
      {node.directory ? <ChevronRight size={12} aria-hidden="true" data-expanded={opened} className={styles.treeChevron} /> : <span className={styles.treeChevron} />}
      <Icon size={16} className={node.directory ? styles.folderIcon : undefined} aria-hidden="true" />
      <span>{node.label}</span>
    </Button>
    {opened && children?.length ? <ul id={groupId}>
      {children.map(child => <ArchiveTreeRow key={child.path} node={child} depth={depth + 1}
        childrenByPath={childrenByPath} expanded={expanded} current={current} onOpen={onOpen} />)}
    </ul> : null}
  </li>;
}

function EntrySource({ entry, openEntry, ru }: { entry: ArchiveEntry; openEntry: OpenEntry; ru: boolean }) {
  const [source, setSource] = useState<Source | "error" | null>(null);
  useEffect(() => {
    if (!entry.previewable) return;
    const controller = new AbortController();
    void openEntry(entry, controller.signal).then(result => {
      if (!controller.signal.aborted) setSource(result);
    }, () => {
      if (!controller.signal.aborted) setSource("error");
    });
    return () => controller.abort();
  }, [entry, openEntry]);

  if (!entry.previewable || source === "error") {
    return <div className={styles.archiveEmpty} role="status"><File size={22} aria-hidden="true" />
      <p>{ru ? "Предпросмотр этого файла недоступен" : "This file can’t be previewed"}</p></div>;
  }
  const loading = <div className={styles.archiveEmpty}><LoadingOrb size="md" label={ru ? "Открываем файл" : "Opening file"} /></div>;
  return source ? <Suspense fallback={loading}><SourceFilePreview {...source} filename={entry.name} ru={ru} /></Suspense> : loading;
}

export function ArchivePreview({ entries, filename, limited, openEntry, ru }: {
  entries: ArchiveEntry[]; filename: string; limited: boolean; openEntry: OpenEntry; ru: boolean;
}) {
  const { nodes, children } = useMemo(() => archiveIndex(entries, ru ? "ru" : "en"), [entries, ru]);
  const [current, setCurrent] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const selection = nodes.get(current);
  const directory = selection?.entry ? current.slice(0, current.lastIndexOf("/") + 1) : current;
  const topLevel = children.get("") ?? [];
  const folderRows = children.get(directory) ?? [];
  const treeLabel = ru ? "Файлы архива" : "Archive files";

  function open(path: string, toggle = false) {
    setCurrent(path);
    setExpanded(previous => {
      const next = new Set(previous);
      const parts = path.split("/");
      let parent = "";
      for (const part of parts.slice(0, -1)) {
        parent += part + "/";
        next.add(parent);
      }
      if (toggle && previous.has(path)) next.delete(path);
      return next;
    });
  }

  let parentPath = "";
  const crumbs = [{ id: "", label: filename, onPress: current ? () => open("") : undefined }];
  for (const part of directory.split("/").filter(Boolean)) {
    parentPath += part + "/";
    const path = parentPath;
    crumbs.push({ id: path, label: part, onPress: path === current ? undefined : () => open(path) });
  }
  if (selection?.entry) crumbs.push({ id: current, label: selection.label, onPress: undefined });

  return <div className={styles.archive}>
    <nav className={styles.archiveSidebar} aria-label={treeLabel}>
      <h2><FileArchive size={16} aria-hidden="true" />{treeLabel}</h2>
      <ul>{topLevel.map(node => <ArchiveTreeRow key={node.path} node={node} depth={0}
        childrenByPath={children} expanded={expanded} current={current} onOpen={open} />)}</ul>
      {limited && <p className={styles.archiveLimit}>{ru ? "Показана часть архива" : "Partial archive listing"}</p>}
    </nav>
    <div className={styles.archivePane}>
      <div className={styles.archivePath}>
        <WorkspaceBreadcrumbs label={ru ? "Путь в архиве" : "Archive path"} overflowLabel={ru ? "Показать полный путь" : "Show full path"} items={crumbs} />
        {selection?.entry && <span>{entrySize(selection.entry.size, ru)}</span>}
      </div>
      {selection?.entry
        ? <EntrySource key={current} entry={selection.entry} openEntry={openEntry} ru={ru} />
        : folderRows.length ? <div className={styles.archiveListing} aria-label={ru ? "Содержимое папки" : "Folder contents"}>
          <ul>{folderRows.map(node => {
            const Icon = node.directory ? Folder : node.entry?.previewable ? FileCode : File;
            return <li key={node.path}><Button size="sm" variant="light" disableRipple className={styles.archiveItem}
              onPress={() => open(node.path)} title={node.label}>
              <Icon size={16} className={node.directory ? styles.folderIcon : undefined} aria-hidden="true" /><span>{node.label}</span>
              {node.entry && <span className={styles.entrySize}>{entrySize(node.entry.size, ru)}</span>}
              {node.directory && <ChevronRight size={14} className={styles.entrySize} aria-hidden="true" />}
            </Button></li>;
          })}</ul>
        </div> : <div className={styles.archiveEmpty} role="status"><FolderOpen size={22} aria-hidden="true" />
          <p>{ru ? "Папка пуста" : "This folder is empty"}</p></div>}
    </div>
  </div>;
}
