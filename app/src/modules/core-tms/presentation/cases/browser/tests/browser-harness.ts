import { defaultFolderExpansion, resolveFolderExpansion } from "../../../../folders/model/expansion/default-expansion";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { hookHarness } from "../../../../state/navigation/browser/tests/project/hook-harness";
import * as selection from "../../bulk/selection/caseSelection";
import * as model from "../../model/caseListModel";
import * as scope from "../../../../folders/model/selection/folder-scope";
import * as tree from "../../../../folders/model/tree";
import { formatCount } from "../../../../localization/format/count";
import { formatCaseEstimate } from "../../model/formatCaseEstimate";
import type { CasesViewProps } from "../../types";
import type { useCaseBulkSelection } from "../../bulk/selection-hook/useCaseBulkSelection";
import type { useCasesViewController } from "../../view/useCasesViewController";
import type { RepositoryFolders } from "../../../../folders/presentation/tree/RepositoryFolders";
import { elements } from "../../bulk/action/tests/bulk-harness";

export { elements };
function runtime() {
  const h = hookHarness("https://tms.example/work/?workspaceId=w&projectId=p&view=cases");
  Object.assign(h.react, { useMemo<T>(compute: () => T, dependencies: readonly unknown[]) {
    const ref = h.react.useRef<{ deps?: readonly unknown[]; value?: T }>({}) as { current: { deps?: readonly unknown[]; value?: T } };
    if (!ref.current.deps || dependencies.some((value, i) => !Object.is(value, ref.current.deps?.[i]))) ref.current = { deps: dependencies, value: compute() };
    return ref.current.value;
  } });
  return h;
}
const jsx = (type: unknown, props: unknown) => ({ type, props });
const proxy = new Proxy({}, { get: (_target, key) => String(key) });
export function browserHarness() {
  const h = runtime(), repository = runtime();
  const folders = [
    { id: "pay", name: "Payments", path: "/Payments", parentId: null },
    { id: "transfer", name: "Transfers", path: "/Payments/Transfers", parentId: "pay" },
    { id: "profile", name: "Profile", path: "/Profile", parentId: null },
    { id: "empty", name: "Empty", path: "/Empty", parentId: null },
    { id: "archive", name: "Old transfers", path: "/Old", parentId: null, archivedAt: "2026-09-09" },
  ].map((folder) => ({ archivedAt: null, ...folder }));
  const items: TestCaseSummary[] = [
    { id: "transfer-case", folderId: "transfer", folderPath: "/Payments/Transfers", title: "Transfer accounts", priority: "high", tags: ["smoke"] },
    { id: "profile-case", folderId: "profile", folderPath: "/Profile", title: "Update profile", priority: "low", tags: ["profile"] },
    { id: "old-case", folderId: "archive", folderPath: "/Old", title: "Transfer old accounts", priority: "high", archivedAt: "2026-09-09" },
    { id: "archived-in-active", folderId: "transfer", folderPath: "/Payments/Transfers", title: "Transfer obsolete", priority: "high", archivedAt: "2026-09-09" },
  ].map((item, index) => ({ projectId: "p", key: `PAY-${index + 1}`, type: "manual", lifecycle: "ready", tags: [], component: "Web",
    currentRevision: 1, revisionCount: 1, archivedAt: null, ownerIdentityId: null, estimatedMinutes: null,
    createdAt: "2026-09-09", updatedAt: "2026-09-09", etag: `"case-${index}:1"`, ...item } as TestCaseSummary));
  const calls: string[] = [];
  const props = { testCases: items, selectedCaseId: "", selectedFolder: "", selectedFolderId: "", query: "",
    filters: { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false },
    folders: { items: folders, loading: false, busy: false, canManage: true, error: "" },
    onSelectFolder: (path: string, id?: string) => { props.selectedFolder = path; props.selectedFolderId = id ?? ""; },
    onSelectCase: (id: string) => { props.selectedCaseId = id; props.testCase = items.find((item) => item.id === id); },
    onNew: () => calls.push("new"), onNewFolder() {}, onImport() {},
  } as unknown as CasesViewProps;
  const bulk = h.load<{ useCaseBulkSelection: typeof useCaseBulkSelection }>(new URL("../../bulk/selection-hook/useCaseBulkSelection.ts", import.meta.url), () => selection);
  const controller = h.load<{ useCasesViewController: typeof useCasesViewController }>(new URL("../../view/useCasesViewController.ts", import.meta.url), (name) => {
    if (name.endsWith("content-transition")) return { transitionContent: (update: () => void) => update() };
    if (name.endsWith("folder-scope")) return scope;
    if (name.endsWith("caseListModel")) return model;
    if (name.endsWith("format/count")) return { formatCount };
    if (name.endsWith("formatCaseEstimate")) return { formatCaseEstimate };
    if (name.endsWith("useCaseBulkSelection")) return bulk;
    if (name.endsWith("useCaseInspectorResize")) return { useCaseInspectorResize: () => ({ style: {}, overlay: false, handleProps: {} }) };
    throw new Error(name);
  }).useCasesViewController;
  const resolvePresentation = (name: string) => name === "react/jsx-runtime" ? { jsx, jsxs: jsx, Fragment: "Fragment" }
    : name.endsWith(".css") ? { default: proxy } : proxy;
  const listing = h.load<{ CasesRepositoryList: (props: unknown) => unknown }>(new URL("../../workspace/CasesRepositoryList.tsx", import.meta.url), resolvePresentation);
  const cases = h.load<{ CasesView: (props: CasesViewProps) => unknown }>(new URL("../../CasesView.tsx", import.meta.url), (name) => {
    if (name.endsWith("useCaseBrowserFocus")) return { useCaseBrowserFocus: () => () => {} };
    if (name.endsWith("useCasesViewController")) return { useCasesViewController: controller };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", languageTag: "en-US", t: (key: string) => key }) };
    return resolvePresentation(name);
  });
  const repositoryComponent = repository.load<{ RepositoryFolders: typeof RepositoryFolders }>(new URL("../../../../folders/presentation/tree/RepositoryFolders.tsx", import.meta.url), (name) => {
    if (name.endsWith("default-expansion")) return { defaultFolderExpansion, resolveFolderExpansion };
    if (name.endsWith("model/tree")) return tree;
    if (name === "@dnd-kit/core") return { useDroppable: () => ({ setNodeRef() {}, isOver: false }) };
    if (name.endsWith("useRepositoryWidth")) return { useRepositoryWidth: () => ({ ref: { current: null }, style: {}, handleProps: {}, width: 304 }), REPOSITORY_MIN: 240, REPOSITORY_MAX: 620 };
    return resolvePresentation(name);
  }).RepositoryFolders;
  const render = () => h.settle(() => controller(props, "en", "en-US"));
  const renderList = () => listing.CasesRepositoryList({ props, view: render(), locale: "en", listPaneRef: { current: null } });
  const renderTree = () => {
    const element = elements(renderList(), (item) => item.type === "RepositoryFolders")[0];
    return repository.settle(() => repositoryComponent(element.props as unknown as Parameters<typeof repositoryComponent>[0]));
  };
  return { props, calls, items, render, renderList, renderTree, renderView: () => h.settle(() => cases.CasesView(props)), dispose() { h.dispose(); repository.dispose(); } };
}
