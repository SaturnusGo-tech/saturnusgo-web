import { Archive, ChevronDown, ChevronRight, Folder, FolderOpen, Plus, Search } from "lucide-react";
import { useMemo } from "react";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "../cases.module.css";
import {
  buildRepositoryTree,
  normalizeRepositoryPath,
  type RepositoryFolderNode,
} from "./repositoryTree";

export type TestCaseRepositoryTreeProps = {
  groups: Array<[string, TestCaseSummary[]]>;
  collapsed: string[];
  selectedFolder: string;
  selectedCaseId: string;
  onToggleFolder: (folder: string) => void;
  onSelectFolder: (folder: string) => void;
  onSelectCase: (id: string) => void;
  onNew: (folderPath?: string) => void;
};

type FolderBranchProps = Omit<TestCaseRepositoryTreeProps, "groups"> & {
  node: RepositoryFolderNode;
  depth: number;
  collapsedPaths: Set<string>;
};

function FolderBranch(props: FolderBranchProps) {
  const { t } = useTmsLocale();
  const {
    node, depth, collapsedPaths, selectedFolder,
    selectedCaseId, onToggleFolder, onSelectFolder, onSelectCase, onNew,
  } = props;
  const isCollapsed = collapsedPaths.has(node.path);
  const isSelected = normalizeRepositoryPath(selectedFolder) === node.path;

  return (
    <div className={styles.repositoryFolderBranch}>
      <div className={`${styles.folderLine} ${isSelected ? styles.folderLineActive : ""}`}>
        <button
          className={styles.folderToggle}
          onClick={() => onToggleFolder(node.path)}
          aria-label={`${isCollapsed ? t("cases.expand") : t("cases.collapse")} ${node.label}`}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          className={styles.folderButton}
          onClick={() => onSelectFolder(node.path)}
          aria-current={isSelected ? "true" : undefined}
          title={node.path}
        >
          {isCollapsed ? <Folder size={15} /> : <FolderOpen size={15} />}
          <span>{node.label}</span><small>{node.caseCount}</small>
        </button>
        <button
          className={styles.folderAdd}
          onClick={() => onNew(node.path)}
          aria-label={t("cases.createInFolder", { folder: node.path })}
          title={t("cases.createInFolder", { folder: node.path })}
        >
          <Plus size={13} />
        </button>
      </div>
      {!isCollapsed && (
        <div className={styles.folderCases}>
          {node.cases.map((item) => (
            <button
              key={item.id}
              className={`${styles.repositoryCase} ${selectedCaseId === item.id ? styles.repositoryCaseActive : ""}`}
              data-repository-case
              tabIndex={selectedCaseId === item.id ? 0 : -1}
              onClick={() => { onSelectFolder(node.path); onSelectCase(item.id); }}
              onKeyDown={(event) => {
                if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const items = event.currentTarget.closest(`.${styles.folderTree}`)?.querySelectorAll<HTMLButtonElement>("[data-repository-case]");
                if (!items?.length) return;
                const index = Array.from(items).indexOf(event.currentTarget);
                const nextIndex = event.key === "Home" ? 0
                  : event.key === "End" ? items.length - 1
                  : Math.max(0, Math.min(items.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
                items[nextIndex]?.focus();
              }}
              aria-current={selectedCaseId === item.id ? "page" : undefined}
              title={`${item.key} · ${item.title}`}
            >
              <span>{item.key}</span><small>{item.title}</small>{item.archivedAt && <Archive size={12} />}
            </button>
          ))}
          {node.children.map((child) => (
            <FolderBranch key={child.path} {...props} node={child} depth={depth + 1} />
          ))}
          {node.cases.length === 0 && node.children.length === 0 && isSelected && (
            <button className={styles.emptyFolder} onClick={() => onNew(node.path)}>
              <Plus size={13} /> {t("cases.addFirst")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TestCaseRepositoryTree(props: TestCaseRepositoryTreeProps) {
  const { t } = useTmsLocale();
  const tree = useMemo(() => buildRepositoryTree(props.groups), [props.groups]);
  const collapsedPaths = useMemo(
    () => new Set(props.collapsed.map(normalizeRepositoryPath)),
    [props.collapsed],
  );
  return (
    <div className={styles.folderTree} aria-label={t("cases.title")}>
      {tree.length === 0 ? (
        <div className={styles.repositoryTreeEmpty}><Search size={20} /><strong>{t("cases.nothingFound")}</strong><span>{t("cases.nothingFoundHint")}</span></div>
      ) : tree.map((node) => (
        <FolderBranch
          key={node.path}
          {...props}
          node={node}
          depth={0}
          collapsedPaths={collapsedPaths}
        />
      ))}
    </div>
  );
}
