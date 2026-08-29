import {
  Archive,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  Search,
} from "lucide-react";
import { type CSSProperties, useMemo } from "react";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "../../../tms.module.css";
import { EmptyState } from "../../common/empty/EmptyState";
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
  const depthStyle = { "--repository-depth": `${depth * 18}px` } as CSSProperties;

  return (
    <div className={styles.repositoryFolderBranch}>
      <div
        className={`${styles.repositoryFolderRow} ${isSelected ? styles.repositoryFolderRowActive : ""}`}
        style={depthStyle}
      >
        <button
          className={styles.repositoryFolderToggle}
          onClick={() => onToggleFolder(node.path)}
          aria-label={`${isCollapsed ? t("cases.expand") : t("cases.collapse")} ${node.label}`}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          className={styles.repositoryFolderButton}
          onClick={() => onSelectFolder(node.path)}
          aria-current={isSelected ? "true" : undefined}
          title={node.path}
        >
          <span className={styles.repositoryFolderIcon}>
            {isCollapsed ? <Folder size={16} /> : <FolderOpen size={16} />}
          </span>
          <span className={styles.repositoryFolderLabel}>{node.label}</span>
          <small className={styles.repositoryFolderCount}>{node.caseCount}</small>
        </button>
        <button
          className={styles.repositoryFolderAdd}
          onClick={() => onNew(node.path)}
          aria-label={t("cases.createInFolder", { folder: node.path })}
          title={t("cases.createInFolder", { folder: node.path })}
        >
          <Plus size={13} />
        </button>
      </div>
      {!isCollapsed && (
        <div className={styles.repositoryFolderChildren}>
          {node.cases.map((item) => (
            <button
              key={item.id}
              className={`${styles.repositoryCaseRow} ${selectedCaseId === item.id ? styles.repositoryCaseRowActive : ""}`}
              style={{ "--repository-depth": `${(depth + 1) * 18}px` } as CSSProperties}
              onClick={() => onSelectCase(item.id)}
              aria-current={selectedCaseId === item.id ? "page" : undefined}
              title={`${item.key} · ${item.title}`}
            >
              <span className={`${styles.repositoryCaseState} ${item.archivedAt ? styles.dotArchived : styles[`dot_${item.lifecycle}`]}`} />
              <small className={styles.repositoryCaseKey}>{item.key}</small>
              <strong className={styles.repositoryCaseTitle}>{item.title}</strong>
              {item.archivedAt && <Archive className={styles.repositoryCaseArchive} size={12} />}
            </button>
          ))}
          {node.children.map((child) => (
            <FolderBranch key={child.path} {...props} node={child} depth={depth + 1} />
          ))}
          {node.cases.length === 0 && node.children.length === 0 && isSelected && (
            <button className={styles.repositoryEmptyFolder} style={depthStyle} onClick={() => onNew(node.path)}>
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
    <nav className={styles.repositoryTree} aria-label={t("cases.title")}>
      {tree.length === 0 ? (
        <EmptyState
          icon={<Search size={25} />}
          title={t("cases.nothingFound")}
          text={t("cases.nothingFoundHint")}
        />
      ) : tree.map((node) => (
        <FolderBranch
          key={node.path}
          {...props}
          node={node}
          depth={0}
          collapsedPaths={collapsedPaths}
        />
      ))}
    </nav>
  );
}
