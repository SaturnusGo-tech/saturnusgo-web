"use client";


import { motion, useIsPresent, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useId, useRef, useState } from "react";
import repository from "../../../folders/presentation/structure/structure.module.css";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import type { ProductDocLifecycleContext } from "../../state/lifecycle/product-doc-lifecycle-context";
import { CreateProductDoc } from "../toolbar/CreateProductDoc";
import { MoveProductDoc } from "../toolbar/MoveProductDoc";
import shared from "../product-docs.module.css";
import styles from "./structure.module.css";
import { ProductDocsStructureBranch } from "./branch/ProductDocsStructureBranch";

export type StructureProps = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  refresh: number;
  lifecycle: ProductDocLifecycleContext;
  lockedId?: string;
  initialPath?: readonly ProductDocNode[];
  onBack(): void;
  onOpen(node: ProductDocNode): void;
  onChanged(): void;
};

export function ProductDocsStructure({ api, scope, copy, refresh, lockedId, initialPath, onBack, onOpen, onChanged, lifecycle }: StructureProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(initialPath?.map((node) => node.id)));
  const [renaming, setRenaming] = useState<string>();
  const [move, setMove] = useState<{ node: ProductDocNode; path: readonly ProductDocNode[] }>();
  const [notice, setNotice] = useState("");
  const moveTrigger = useRef<HTMLButtonElement>(null);
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
      <ProductDocsStructureBranch api={api} scope={scope} copy={copy} refresh={refresh} lockedId={lockedId} lifecycle={lifecycle}
        path={[]} expanded={expanded} renaming={renaming} onToggle={toggle} onRename={setRenaming} onOpen={onOpen}
        onMove={(node, path, trigger) => { moveTrigger.current = trigger; setMove({ node, path }); }}
        onChanged={changed} />
      {notice && <p className={repository.notice} role="status">{notice}</p>}
    </div>
    {move && <MoveProductDoc api={api} scope={scope} copy={copy} document={move.node} path={move.path}
      onMoved={() => changed(copy.structureSaved)} onClose={() => {
        setMove(undefined);
        moveTrigger.current?.focus({ preventScroll: true });
      }} />}
  </motion.section>;
}
