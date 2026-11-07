"use client";

import { BookOpen, FileText, Folder, Minus, Plus, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocList } from "../../state/tree/useProductDocList";
import { ReadState } from "../status/ReadState";
import styles from "../product-docs.module.css";

type TreeProps = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  projectName?: string;
  copy: ProductDocsCopy;
  selectedId?: string;
  path?: readonly ProductDocNode[];
  refresh: number;
  draft: boolean;
  onHome(): void;
  onSelect(node: ProductDocNode): void;
};

export function ProductDocsTree(props: TreeProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const searchId = useId();

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 230);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const path = props.path;
    if (path?.length) setOpen((current) => new Set([...current, ...path.map((node) => node.id)]));
  }, [props.path]);

  function toggle(id: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function choose(node: ProductDocNode) {
    if (node.kind === "folder") setOpen((current) => new Set([...current, node.id]));
    props.onSelect(node);
  }

  return <aside className={styles.tree} aria-label={props.copy.tree}>
    <button type="button" className={styles.space} onClick={props.onHome}>
      <span className={styles.spaceIcon}><BookOpen size={18} aria-hidden="true" /></span>
      <span><strong>{props.projectName || props.copy.title}</strong>
        {props.projectName && <small>{props.copy.title}</small>}</span>
    </button>
    <label className={styles.search} htmlFor={searchId}>
      <Search size={16} aria-hidden="true" />
      <input id={searchId} type="search" aria-label={props.copy.search} placeholder={props.copy.search}
        maxLength={120} value={query} onChange={(event) => setQuery(event.target.value)} />
    </label>
    <nav aria-label={search ? props.copy.searchResults : props.copy.tree} className={styles.treeNav}>
      <h2>{search ? props.copy.searchResults : props.copy.tree}</h2>
      <Branch {...props} parentId={null} query={search} open={open} onToggle={toggle} onChoose={choose} />
    </nav>
  </aside>;
}

function Branch(props: TreeProps & {
  parentId: string | null;
  query?: string;
  open: ReadonlySet<string>;
  onToggle(id: string): void;
  onChoose(node: ProductDocNode): void;
}) {
  const { data, loading, error, retry, more } = useProductDocList(props.api, props.scope, {
    parentId: props.query ? undefined : props.parentId,
    q: props.query || undefined,
    refresh: props.refresh,
    draft: props.draft,
  });

  if (!data && loading) return <ReadState copy={props.copy} status="loading" retry={retry} />;
  if (error && !data?.nodes.length) return <ReadState copy={props.copy} status="error" retry={retry} />;

  return <>
    {data?.nodes.length ? <ul className={styles.branch}>
      {data.nodes.map((node) => {
        const expanded = props.open.has(node.id);
        const selected = props.selectedId === node.id;
        const Icon = node.kind === "folder" ? Folder : FileText;
        return <li key={node.id}>
          <div className={styles.treeRow} data-current={selected || undefined}>
            {!props.query && <button type="button" className={styles.disclosure}
              aria-label={node.title} aria-expanded={expanded} onClick={() => props.onToggle(node.id)}>
              {expanded ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
            </button>}
            <button type="button" className={styles.node} aria-current={selected ? "page" : undefined}
              onClick={() => props.onChoose(node)} title={node.title}>
              <Icon size={15} aria-hidden="true" />
              <span>{node.title}</span>
              {node.kind === "page" && node.publishedVersion === null && <small>{props.copy.draft}</small>}
            </button>
          </div>
          {expanded && !props.query && <div className={styles.nested}>
            <Branch {...props} parentId={node.id} />
          </div>}
        </li>;
      })}
    </ul> : <p className={styles.treeEmpty}>{props.query ? props.copy.noResults : props.copy.noPages}</p>}
    {error
      ? <button type="button" className={styles.action} onClick={retry}>{props.copy.retry}</button>
      : data?.nextCursor && <button type="button" className={styles.action} disabled={loading} onClick={more}>{props.copy.more}</button>}
  </>;
}
