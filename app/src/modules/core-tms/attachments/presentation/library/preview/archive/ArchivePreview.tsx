"use client";

import { Button, Input } from "@heroui/react";
import { ChevronRight, File, Folder, FolderOpen, PanelLeft, Search } from "lucide-react";
import { lazy, Suspense, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const Icon = node.directory ? Folder : File;
  const children = childrenByPath.get(node.path);
  return <li>
    <Button size="sm" variant="light" disableRipple className={styles.treeRow} onPress={() => onOpen(node.path, node.directory)}
      aria-current={current === node.path ? "location" : undefined}
      aria-expanded={node.directory ? opened : undefined} aria-controls={opened && children?.length ? groupId : undefined}
      style={{ paddingInlineStart: 4 + Math.min(depth, 10) * 16 }} title={node.label}>
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
  return source ? <Suspense fallback={loading}><SourceFilePreview {...source} filename={entry.name} size={entry.size} ru={ru} /></Suspense> : loading;
}

export function ArchivePreview({ entries, filename, limited, openEntry, ru }: {
  entries: ArchiveEntry[]; filename: string; limited: boolean; openEntry: OpenEntry; ru: boolean;
}) {
  const { nodes, children } = useMemo(() => archiveIndex(entries, ru ? "ru" : "en"), [entries, ru]);
  const [current, setCurrent] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [treeVisible, setTreeVisible] = useState(true);
  const [query, setQuery] = useState("");
  const treeToggle = useRef<HTMLButtonElement>(null);
  const restoreTreeFocus = useRef(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const selection = nodes.get(current);
  const directory = selection?.entry ? current.slice(0, current.lastIndexOf("/") + 1) : current;
  const topLevel = children.get("") ?? [];
  const folderRows = children.get(directory) ?? [];
  const treeLabel = ru ? "Файлы архива" : "Archive files";
  const searchLabel = ru ? "Перейти к файлу" : "Go to file";
  const treeId = useId();
  const search = query.trim().toLocaleLowerCase();
  const matches = useMemo(() => search
    ? Array.from(nodes.values()).filter(node => !node.directory && node.path.toLocaleLowerCase().includes(search)).slice(0, 100)
    : [], [nodes, search]);

  useLayoutEffect(() => {
    if (!restoreTreeFocus.current) return;
    restoreTreeFocus.current = false;
    treeToggle.current?.focus();
  }, [treeVisible]);

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

  const toggleTree = <Button ref={treeToggle} size="sm" isIconOnly disableRipple className={styles.treeToggle}
    aria-label={treeVisible ? (ru ? "Скрыть дерево файлов" : "Collapse file tree") : (ru ? "Показать дерево файлов" : "Expand file tree")}
    aria-expanded={treeVisible} aria-controls={treeId} onPress={() => {
      restoreTreeFocus.current = true;
      setTreeVisible(visible => !visible);
    }}><PanelLeft size={16} aria-hidden="true" /></Button>;

  return <div className={styles.archive} data-tree-hidden={!treeVisible || undefined}>
    <nav className={styles.archiveSidebar} aria-label={treeLabel} hidden={!treeVisible} id={treeId}>
      <div className={styles.treeHeader}>
        <div className={styles.treeTitle}>{treeVisible && toggleTree}<h2>{ru ? "Файлы" : "Files"}</h2></div>
        <Input ref={searchInput} aria-label={searchLabel} placeholder={searchLabel} value={query} onValueChange={setQuery} size="sm" radius="sm" isClearable
          startContent={<Search size={16} aria-hidden="true" />}
          classNames={{ inputWrapper: styles.treeSearch, innerWrapper: styles.treeSearchContent, input: styles.treeSearchInput }} />
      </div>
      {search ? <ul>{matches.map(node => <li key={node.path}>
        <Button size="sm" variant="light" disableRipple className={styles.treeRow} title={node.path}
          onPress={() => {
            open(node.path);
            setQuery("");
            searchInput.current?.focus();
          }}><File size={16} aria-hidden="true" /><span>{node.path}</span></Button>
      </li>)}</ul> : <ul>{topLevel.map(node => <ArchiveTreeRow key={node.path} node={node} depth={0}
        childrenByPath={children} expanded={expanded} current={current} onOpen={open} />)}</ul>}
      {search && !matches.length && <p className={styles.archiveLimit} role="status">{ru ? "Файлы не найдены" : "No matching files"}</p>}
      {limited && <p className={styles.archiveLimit}>{ru ? "Показана часть архива" : "Partial archive listing"}</p>}
    </nav>
    <div className={styles.archivePane}>
      <div className={styles.archivePath}>
        {!treeVisible && toggleTree}
        <WorkspaceBreadcrumbs label={ru ? "Путь в архиве" : "Archive path"} overflowLabel={ru ? "Показать полный путь" : "Show full path"}
          separator={<span aria-hidden="true">/</span>} items={crumbs} />
      </div>
      {selection?.entry
        ? <EntrySource key={current} entry={selection.entry} openEntry={openEntry} ru={ru} />
        : folderRows.length ? <div className={styles.archiveListing} aria-label={ru ? "Содержимое папки" : "Folder contents"}>
          <ul>{folderRows.map(node => {
            const Icon = node.directory ? Folder : File;
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
