import type {
  Activity,
  TestCaseRevision,
  TestCaseSummary,
} from "../../../../core/tms/contracts/legacy-contract";
import type { CaseFilters } from "../../state/types/workspace";

export type CasesViewProps = {
  query: string;
  onQuery: (value: string) => void;
  groups: Array<[string, TestCaseSummary[]]>;
  collapsed: string[];
  onToggleFolder: (folder: string) => void;
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  selectedCaseId: string;
  onSelectCase: (id: string) => void;
  testCase?: TestCaseSummary;
  revision: TestCaseRevision | null;
  linkIds: string[];
  onNew: (folderPath?: string) => void;
  onEdit: () => void;
  onClone: () => void;
  onArchive: () => void;
  onRunCase: () => void;
  activity: Activity[];
  filters: CaseFilters;
  onFilters: (filters: CaseFilters) => void;
  onNewFolder: () => void;
  onNewProject: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
};

export type CaseListRow = {
  testCase: TestCaseSummary;
  folderPath: string;
};

export type CaseSortKey =
  | "key"
  | "title"
  | "lifecycle"
  | "priority"
  | "component"
  | "estimate";

export type CaseSort = { key: CaseSortKey; direction: "asc" | "desc" };
