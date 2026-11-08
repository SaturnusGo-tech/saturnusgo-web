"use client";

import { motion, useIsPresent, useReducedMotion } from "framer-motion";
import { Archive, ArrowLeft, ChevronRight, FolderInput } from "lucide-react";
import { useId, useRef, useState } from "react";
import repository from "../../../folders/presentation/structure/structure.module.css";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocList } from "../../state/tree/useProductDocList";
import { ArchiveProductDoc } from "../archive/ArchiveProductDoc";
import { ProductDocsDisclosure } from "../motion/ProductDocsDisclosure";
import { ReadState } from "../status/ReadState";
import { CreateProductDoc } from "../toolbar/CreateProductDoc";
import { MoveProductDoc } from "../toolbar/MoveProductDoc";
import { ProductDocSectionIcon } from "../tree/appearance/ProductDocSectionIcon";
import shared from "../product-docs.module.css";
import styles from "./structure.module.css";
import { RenameFolder } from "./RenameFolder";

type StructureProps = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  refresh: number;
  lockedId?: string;
  initialPath?: readonly ProductDocNode[];
  onBack(): void;
  onOpen(node: ProductDocNode): void;
  onChanged(): void;
  onArchived(): void;
};

export function ProductDocsStructure({ api, scope, copy, refresh, lockedId, initialPath, onBack, onOpen, onChanged, onArchived }: StructureProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(initialPath?.map((node) => node.id)));
  const [renaming, setRenaming] = useState<string>();
  const [move, setMove] = useState<{ node: ProductDocNode; path: readonly ProductDocNode[] }>();
  const [archive, setArchive] = useState<ProductDocNode>();
  const [notice, setNotice] = useState("");
  const moveTrigger = useRef<HTMLButtonElement>(null);
  const archiveTrigger = useRef<HTMLButtonElement>(null);
  const heading = useId();
  const present = useIsPresent();
  const reduced = useReducedMotion();

  function toggle(id: string, forceOpen = false) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (!forceOpen && next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function changed(message: string) {
    setNotice(message);
    onChanged();
  }

  return <motion.section className={`${shared.main} ${styles.screen}`} aria-labelledby={heading}
    ref={(element) => { if (element) element.inert = !present; }}
    aria-hidden={!present || undefined}
    initial={{ opacity: 0, x: reduced ? 0 : 10 }} animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: reduced ? 0 : 8, transition: { duration: reduced ? 0 : .16 } }}
    transition={{ duration: reduced ? 0 : .24, ease: [.2, .7, .25, 1] }}>
    <div className={`${repository.content} ${styles.content}`}>
      <button type="button" className={styles.back} onClick={onBack} autoFocus>
        <ArrowLeft size={16} aria-hidden="true" />{copy.backToDocs}
      </button>
      <header className={styles.heading}>
        <h1 id={heading}>{copy.structure}</h1>
        <CreateProductDoc api={api} scope={scope} copy={copy} kind="folder" parentId={null} labelled
          onCreated={() => changed(copy.folderCreated)} />
      </header>
      <StructureBranch api={api} scope={scope} copy={copy} refresh={refresh} lockedId={lockedId}
        path={[]} expanded={expanded} renaming={renaming} onToggle={toggle} onRename={setRenaming} onOpen={onOpen}
        onMove={(node, path, trigger) => { moveTrigger.current = trigger; setMove({ node, path }); }}
        onArchive={(node, trigger) => { archiveTrigger.current = trigger; setArchive(node); }}
        onChanged={changed} />
      {notice && <p className={repository.notice} role="status">{notice}</p>}
    </div>
    {move && <MoveProductDoc api={api} scope={scope} copy={copy} document={move.node} path={move.path}
      onMoved={() => changed(copy.structureSaved)} onClose={() => {
        setMove(undefined);
        moveTrigger.current?.focus({ preventScroll: true });
      }} />}
    {archive && <ArchiveProductDoc api={api} scope={scope} node={archive} copy={copy}
      onArchived={() => { setArchive(undefined); onArchived(); }}
      onClose={(stale) => {
        setArchive(undefined);
        if (stale) onChanged();
        archiveTrigger.current?.focus({ preventScroll: true });
      }} />}
  </motion.section>;
}

type BranchProps = Pick<StructureProps, "api" | "scope" | "copy" | "refresh" | "lockedId" | "onOpen"> & {
  path: readonly ProductDocNode[];
  expanded: ReadonlySet<string>;
  renaming?: string;
  onToggle(id: string, forceOpen?: boolean): void;
  onRename(id?: string): void;
  onMove(node: ProductDocNode, path: readonly ProductDocNode[], trigger: HTMLButtonElement): void;
  onArchive(node: ProductDocNode, trigger: HTMLButtonElement): void;
  onChanged(message: string): void;
};

function StructureBranch(props: BranchProps) {
  const { api, scope, copy, refresh, path } = props;
  const parentId = path[path.length - 1]?.id ?? null;
  const { data, loading, error, retry, more } = useProductDocList(api, scope, { parentId, refresh, draft: true });

  if (error && !data?.nodes.length) return <ReadState copy={copy} status="error" retry={retry} />;
  if (!data) return <ReadState copy={copy} status="loading" retry={retry} />;
  return <>
    {data.nodes.length > 0 ? <ul className={path.length ? repository.children : repository.tree}>
      {data.nodes.map((node) => <StructureRow key={node.id} {...props} node={node} canEdit={data.canEdit} canMove={data.canPublish} />)}
    </ul> : <p className={repository.empty}>{path.length ? copy.noPages : copy.structureEmpty}</p>}
    {error
      ? <button type="button" className={shared.action} onClick={retry}>{copy.retry}</button>
      : data.nextCursor && <button type="button" className={shared.action} onClick={more} disabled={loading}>{copy.more}</button>}
  </>;
}

function StructureRow({ node, canEdit, canMove, ...props }: BranchProps & { node: ProductDocNode; canEdit: boolean; canMove: boolean }) {
  const { api, scope, copy, path, expanded, lockedId, renaming, onToggle, onRename, onOpen, onMove, onArchive, onChanged } = props;
  const childrenId = useId();
  const title = useRef<HTMLButtonElement>(null);
  const folder = node.kind === "folder";
  const open = expanded.has(node.id);
  const canMutate = canEdit && lockedId !== node.id;
  const editing = renaming === node.id;
  const branchPath = [...path, node];

  function finishRename() {
    onRename();
    requestAnimationFrame(() => title.current?.focus({ preventScroll: true }));
  }

  return <li className={repository.branch}>
    <div className={`${repository.row} ${styles.row}`}>
      <button type="button" className={repository.disclosure}
        aria-label={`${open ? copy.collapseBranch : copy.expandBranch} ${node.title}`}
        aria-expanded={open} aria-controls={open ? childrenId : undefined} onClick={() => onToggle(node.id)}>
        <ChevronRight className={shared.disclosureChevron} size={15} aria-hidden="true" />
      </button>
      <ProductDocSectionIcon scope={scope} node={node} size={17} />
      {editing ? <RenameFolder api={api} scope={scope} copy={copy} node={node} onClose={finishRename}
        onSaved={() => onChanged(copy.structureSaved)} /> :
        <button type="button" ref={title} className={`${repository.name} ${styles.name}`}
          disabled={folder && canMutate && Boolean(renaming)}
          aria-label={folder && canMutate ? `${copy.renameItem} ${node.title}` : undefined} title={node.title}
          onClick={() => folder && canMutate ? onRename(node.id) : onOpen(node)}>{node.title}</button>}
      {!folder && node.publishedVersion === null && <span className={styles.draft}>{copy.draft}</span>}
      {canMutate && canMove && <button type="button" className={repository.add} title={copy.move} disabled={Boolean(renaming)}
        aria-label={`${copy.move} ${node.title}`} onClick={(event) => onMove(node, path, event.currentTarget)}>
        <FolderInput size={16} aria-hidden="true" />
      </button>}
      {canMutate && canMove && <button type="button" className={repository.add} title={copy.archiveItem} disabled={Boolean(renaming)}
        aria-label={`${copy.archiveItem} ${node.title}`} onClick={(event) => onArchive(node, event.currentTarget)}>
        <Archive size={16} aria-hidden="true" />
      </button>}
      {canMutate && !renaming && <CreateProductDoc api={api} scope={scope} copy={copy}
        kind="folder" parentId={node.id} onCreated={() => {
          onToggle(node.id, true);
          onChanged(copy.folderCreated);
        }} />}
    </div>
    <ProductDocsDisclosure id={childrenId} open={open}>
      <div className={repository.branchChildren}><StructureBranch {...props} path={branchPath} /></div>
    </ProductDocsDisclosure>
  </li>;
}
