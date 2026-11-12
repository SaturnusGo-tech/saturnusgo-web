"use client";

import { Button, Drawer, DrawerContent } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { FolderOpen, X } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { buildFolderTree } from "../../../../folders/model/tree";
import { RepositoryFolderBranch } from "../../../../folders/presentation/branch/RepositoryFolderBranch";
import { RepositoryCaseLeaf } from "../../../../folders/presentation/case/RepositoryCaseLeaf";
import repositoryStyles from "../../../../folders/presentation/styles/repository.module.css";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { ProductDocScope } from "../../../domain/product-docs";
import type { ProductDocRepositoryTarget } from "../../../navigation/product-doc-smart-link";
import { useProductDocRepository } from "../../../state/inspector/useProductDocRepository";
import { repositoryPanelAncestors } from "./repository-panel-tree";
import styles from "./product-doc-repository-panel.module.css";

type Props = {
  target?: ProductDocRepositoryTarget;
  scope: ProductDocScope;
  trigger?: HTMLElement;
  onClose(): void;
  onCase(id: string, trigger: HTMLElement, projectId: string): void;
};
type Resource = NonNullable<Extract<ReturnType<typeof useProductDocRepository>, { status: "ready" }>["data"]>;
const noSelection = new Set<string>();
const noop = () => {};

export function ProductDocRepositoryPanel({ target, scope, trigger, onClose, onCase }: Props) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const reduced = useReducedMotion();
  const resource = useProductDocRepository(scope, target);
  const record = resource.status === "ready" ? resource.data : undefined;
  const opener = useRef<HTMLElement | undefined>(trigger);
  useLayoutEffect(() => { if (target) opener.current = trigger; }, [target, trigger]);

  return <Drawer isOpen={Boolean(target)} onClose={onClose} placement="right" size="2xl" hideCloseButton
    aria-label={ru ? "Репозиторий тест-кейсов" : "Test case repository"}
    disableAnimation={Boolean(reduced)} classNames={{ wrapper: styles.wrapper, backdrop: styles.backdrop, base: styles.drawer }}
    motionProps={{ onAnimationComplete: definition => {
      if (definition === "exit" && opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    } }}>
    <DrawerContent>
      <header className={styles.header}>
        <div><span className={styles.project}>{record?.projectName ?? (ru ? "Репозиторий" : "Repository")}</span>
          <h2>{record?.folder.name ?? (ru ? "Тест-кейсы" : "Test cases")}</h2></div>
        <Button isIconOnly variant="light" radius="full" size="sm" onPress={onClose}
          aria-label={ru ? "Закрыть репозиторий" : "Close repository"}><X size={17} aria-hidden="true" /></Button>
      </header>
      {target && (resource.status === "loading" ? <div className={styles.state} role="status">
        <LoadingOrb size="md" /><span>{ru ? "Загрузка репозитория…" : "Loading repository…"}</span>
      </div> : record ? <RepositoryTree key={`${record.projectId}:${record.folder.id}`} record={record} ru={ru} onCase={onCase} />
        : <div className={styles.state} role="status"><FolderOpen size={25} aria-hidden="true" />
          <p>{ru ? "Эта папка недоступна. Возможно, она была удалена или у вас нет доступа к проекту."
            : "This folder is unavailable. It may have been removed, or you may not have access to its project."}</p></div>)}
    </DrawerContent>
  </Drawer>;
}

function RepositoryTree({ record, ru, onCase }: { record: Resource; ru: boolean; onCase: Props["onCase"] }) {
  const tree = useMemo(() => buildFolderTree(record.folders, record.cases, false, true), [record.folders, record.cases]);
  const [expanded, setExpanded] = useState(() => repositoryPanelAncestors(record.folders, record.folder.id));
  const [selectedFolder, setSelectedFolder] = useState(record.folder.id);
  const treeRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => treeRef.current?.querySelector<HTMLElement>("[data-repository-folder-row][data-selected]")
      ?.scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "instant" : "smooth" }));
    return () => cancelAnimationFrame(frame);
  }, [record.folder.id, reduced]);

  function openCase(item: TestCaseSummary) {
    const row = treeRef.current?.querySelector<HTMLElement>(`[data-repository-drag-id="tree-case:${CSS.escape(item.id)}"]`);
    const trigger = row?.matches("button, [role=button]") ? row : row?.querySelector<HTMLElement>("button, [role=button]");
    if (trigger) onCase(item.id, trigger, record.projectId);
  }

  return <div className={`${repositoryStyles.repository} ${styles.repository}`}>
    <div ref={treeRef} className={repositoryStyles.treeScroll}>
      <ul className={repositoryStyles.tree} aria-label={ru ? "Папки и тест-кейсы" : "Folders and test cases"}>
        {tree.roots.map(node => <RepositoryFolderBranch key={node.folder.id} node={node} depth={0}
          expanded={expanded} selected={noSelection} selectedFolder="" selectedFolderId={selectedFolder}
          activeCaseId="" ru={ru} locked={false} canManage={false} canSelect={false} titleMode="inline"
          onExpand={id => setExpanded(current => { const next = new Set(current); if (!next.delete(id)) next.add(id); return next; })}
          onFolder={(_path, id) => { if (id) setSelectedFolder(id); }} onCase={openCase}
          onToggle={noop} onScope={noop} onMenu={noop} />)}
        {tree.unfiled.map(item => <RepositoryCaseLeaf key={item.id} item={item} depth={0} selected={false} active={false}
          locked={false} canManage={false} canSelect={false} titleMode="inline" ru={ru} onToggle={noop} onOpen={openCase} />)}
      </ul>
    </div>
  </div>;
}
