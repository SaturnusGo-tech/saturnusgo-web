import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { repositoryScope } from "../../../../folders/model/selection/folder-scope";

type Node = { type: string; props: Record<string, unknown> };
function renderModule(path: string, actionMenu = false) {
  let stateIndex = 0;
  const module = { exports: {} as Record<string, (...args: unknown[]) => unknown> };
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const jsx = (type: string, props: Record<string, unknown>) => ({ type, props });
  const proxy = new Proxy({}, { get: (_target, key) => String(key) });
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports,
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useState: (initial: unknown) => [actionMenu && stateIndex++ === 1 ? true : typeof initial === "function" ? initial() : initial, () => {}],
        useDeferredValue: (value: unknown) => value, useMemo: (fn: () => unknown) => fn(), useEffect: () => {}, useRef: (current: unknown) => ({ current }), useId: () => "ql",
      };
      if (name.endsWith("WorkspacePeopleContext")) return { useWorkspacePeople: () => ({ workspaceId: "w", offline: true }) };
      if (name.endsWith("useMemberDirectory")) return { useMemberDirectory: () => ({ members: new Map(), items: [], loading: false, error: false }) };
      if (name.endsWith("folder-scope")) return { repositoryScope };
      if (name.endsWith("caseListModel")) return {
        filterCaseRows: (rows: unknown, filters: { titleQuery?: string }) => filters.titleQuery === "missing" ? [] : rows, sortCaseRows: (rows: unknown) => rows,
        resolveDependentCaseFacets: () => ({ folders: [], components: [] }),
        groupCaseRows: () => [], visibleCaseTabStop: () => null,
      };
      if (name.endsWith("format/count")) return { formatCount: () => "0 cases" };
      if (name.endsWith("useCaseInspectorResize")) return { useCaseInspectorResize: () => ({}) };
      if (name.endsWith("useCaseBulkSelection")) return { useCaseBulkSelection: () => ({ clear: () => {} }) };
      if (name.endsWith(".css")) return { default: proxy };
      return proxy;
    },
  });
  return module.exports;
}
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
const filters = { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false };

test("archived durable identity prevents the controller from creating into an active folder with the same path", () => {
  const calls: string[] = [];
  const items = [{ id: "active", path: "/Payments", archivedAt: null }, { id: "archived", path: "/Payments", archivedAt: "2026-09-09" }];
  for (const selectedFolderId of ["archived", "active"]) {
    const source = renderModule("../../view/useCasesViewController.ts");
    const view = source.useCasesViewController({ folders: { items }, selectedFolderId, selectedFolder: "/Payments",
      selectedCaseId: "", testCases: [], query: "", filters, onNew: (path: string) => calls.push(path) }, "ru", "ru-RU") as {
      folderArchived: boolean; createCase: (path?: string) => void;
    };
    assert.equal(view.folderArchived, selectedFolderId === "archived");
    view.createCase();
    if (selectedFolderId === "archived") assert.deepEqual(calls, []);
  }
  assert.deepEqual(calls, ["/Payments"]);
});

test("archive toolbar disables both creation buttons while keeping search and filters usable", () => {
  let created = 0; let filtered = 0; let query = "";
  const source = renderModule("../../toolbar/CasesToolbar.tsx", true);
  const tree = source.CasesToolbar({ locale: "ru", query: "", countLabel: "0", filters, filterOpen: false,
    selectedFolder: "/Payments", repositoryMode: true, folderArchived: true, selectionMode: false,
    onNew: () => { created++; }, onQuery: (value: string) => { query = value; }, onFilterOpen: () => { filtered++; } });
  const all = nodes(tree);
  const createButtons = all.filter(node => node.type === "button" && ["Новый кейс", "Новый тест-кейс"].includes(text(node.props.children)));
  assert.equal(createButtons.length, 2);
  for (const button of createButtons) {
    assert.equal(button.props.disabled, true);
    (button.props.onClick as () => void)();
  }
  assert.equal(created, 0);
  const search = all.find(node => node.type === "input")!;
  assert.notEqual(search.props.disabled, true);
  (search.props.onChange as (event: unknown) => void)({ target: { value: "refund" } });
  const filter = all.find(node => node.props["data-testid"] === "case-filter-toggle")!;
  assert.notEqual(filter.props.disabled, true);
  (filter.props.onClick as () => void)();
  assert.equal(query, "refund"); assert.equal(filtered, 1);
});

test("empty archive hides creation while an empty active project keeps the canonical creator", () => {
  let created = 0;
  for (const folderArchived of [true, false]) {
    const source = renderModule("../../list/CasesTable.tsx");
    const tree = source.CasesTable({ locale: "ru", rows: [], repositoryEmpty: true, folderArchived,
      selectedCaseId: "", onCreate: () => { created++; } });
    const create = nodes(tree).find(node => node.type === "button" && text(node.props.children) === "Создать кейс");
    assert.equal(Boolean(create), !folderArchived);
    if (create) (create.props.onClick as () => void)();
  }
  assert.equal(created, 1);
});

test("empty folder guidance uses unfiltered scope and keeps search guidance for hidden existing cases", () => {
  const folders = { items: [{ id: "active", path: "/Payments", archivedAt: null }] };
  for (const hasCase of [true, false]) {
    const source = renderModule("../../view/useCasesViewController.ts");
    const testCases = hasCase ? [{ id: "case", folderId: "active", folderPath: "/Payments", archivedAt: null, etag: "etag", tags: [] }] : [];
    const view = source.useCasesViewController({ folders, selectedFolderId: "active", selectedFolder: "/Payments", selectedCaseId: "",
      testCases, query: "missing", filters }, "ru", "ru-RU") as { rows: unknown[]; folderEmpty: boolean };
    assert.equal(view.rows.length, 0);
    assert.equal(view.folderEmpty, !hasCase);
    const table = renderModule("../../list/CasesTable.tsx");
    const tree = table.CasesTable({ locale: "ru", rows: [], folderEmpty: view.folderEmpty, repositoryEmpty: !hasCase, selectedCaseId: "" });
    if (hasCase) assert.match(text(tree), /Измените поиск/);
    else { assert.match(text(tree), /В папке пока нет тест-кейсов/); assert.doesNotMatch(text(tree), /Измените поиск/); }
  }
});
