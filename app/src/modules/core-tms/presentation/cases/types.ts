import type {
  Activity,
  TestCaseRevision,
  TestCaseSummary,
} from "../../../../core/tms/contracts/legacy-contract";
import type { CaseFilters } from "../../state/types/workspace";
import type { CaseInspectorEditor } from "./inspector/model";

export type CasesViewProps = {
  query: string;
  onQuery: (value: string) => void;
  testCases: TestCaseSummary[];
  groups: Array<[string, TestCaseSummary[]]>;
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
  detailLoadError: boolean;
  onRetryDetail: () => void;
  editor?: CaseInspectorEditor;
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
