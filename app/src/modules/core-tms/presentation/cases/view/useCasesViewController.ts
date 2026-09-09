import { repositoryScope } from "../../../folders/model/selection/folder-scope";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCount } from "../../../localization/format/count";
import type { TmsLocale } from "../../../localization/model/locale";
import {
  filterCaseRows,
  resolveDependentCaseFacets,
  sanitizeDependentCaseFacets,
  sortCaseRows,
  type CaseFacetFilters,
  type CaseGroupBy,
  type CaseListViewMode,
} from "../model/caseListModel";
import { useCaseInspectorResize } from "../split/useCaseInspectorResize";
import { useCaseBulkSelection } from "../bulk/selection-hook/useCaseBulkSelection";
import type { CaseListRow, CaseSort, CaseSortKey, CasesViewProps } from "../types";
import { formatCaseEstimate } from "../model/formatCaseEstimate";

export function useCasesViewController(
  props: CasesViewProps,
  locale: TmsLocale,
  languageTag: string,
) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(Boolean(props.selectedCaseId));
  const [detailFullscreen, setDetailFullscreen] = useState(false);
  const [sort, setSort] = useState<CaseSort>({ key: "key", direction: "asc" });
  const [qlQuery, setQlQuery] = useState("");
  const [viewMode, setViewMode] = useState<CaseListViewMode>("list");
  const [groupBy, setGroupBy] = useState<CaseGroupBy>("none");
  const [selectionMode, setSelectionMode] = useState(false);
  const [repositoryArchived, setRepositoryArchived] = useState(false);
  const [facetFilters, setFacetFilters] = useState<CaseFacetFilters>({ folders: [], components: [] });
  const workspaceRef = useRef<HTMLDivElement>(null);
  const inspectorResize = useCaseInspectorResize(workspaceRef);

  const allRows = useMemo<CaseListRow[]>(() => props.testCases.map((testCase) => ({
    testCase, folderPath: testCase.folderPath,
  })), [props.testCases]);
  const folderScope = useMemo(() => repositoryScope(props.folders?.items ?? [], props.selectedFolderId, props.selectedFolder), [props.folders?.items, props.selectedFolderId, props.selectedFolder]);
  const folderEmpty = Boolean(props.folders?.items.some((folder) => folder.id === props.selectedFolderId && !folder.archivedAt)
    && !allRows.some(({ testCase }) => folderScope.includes(testCase)));
  const baseRows = useMemo(() => filterCaseRows(allRows.filter(({ testCase }) => (
    (props.folders || props.filters.includeArchived || folderScope.archived || !testCase.archivedAt)
    && (props.filters.type === "all" || testCase.type === props.filters.type)
    && (props.filters.priority === "all" || testCase.priority === props.filters.priority)
    && (props.filters.lifecycle === "all" || testCase.lifecycle === props.filters.lifecycle)
    && (!props.filters.tag.trim() || testCase.tags.some((tag) => (
      tag.toLocaleLowerCase().includes(props.filters.tag.trim().toLocaleLowerCase())
    )))
  )), { titleQuery: props.query }), [allRows, props.folders, props.filters, props.query, folderScope.archived]);
  const facetOptions = useMemo(
    () => resolveDependentCaseFacets(baseRows, facetFilters),
    [baseRows, facetFilters],
  );
  const matchingRows = useMemo(() => sortCaseRows(filterCaseRows(baseRows, {
    qlQuery, facets: facetFilters,
  }), sort, languageTag), [baseRows, facetFilters, languageTag, qlQuery, sort]);
  const rows = useMemo(() => matchingRows.filter(({ testCase }) => (!props.folders || folderScope.includes(testCase))
    && (props.filters.includeArchived || folderScope.archived || !testCase.archivedAt)), [matchingRows, props.folders, folderScope, props.filters.includeArchived]);
  const treeFiltered = Boolean(props.query.trim() || qlQuery.trim() || facetFilters.folders.length || facetFilters.components.length
    || props.filters.type !== "all" || props.filters.priority !== "all" || props.filters.lifecycle !== "all" || props.filters.tag.trim());
  const selectableRows = useMemo(() => allRows.filter(({ testCase }) => (
    !testCase.archivedAt && Boolean(testCase.etag)
  )), [allRows]);
  const selectableIds = useMemo(
    () => new Set(selectableRows.map(({ testCase }) => testCase.id)),
    [selectableRows],
  );
  const selectableVisibleRows = useMemo(
    () => rows.filter(({ testCase }) => !repositoryArchived && selectableIds.has(testCase.id)),
    [rows, selectableIds, repositoryArchived],
  );
  const bulkSelection = useCaseBulkSelection(selectableRows, selectableVisibleRows);
  const totalCount = allRows.filter(({ testCase }) => props.filters.includeArchived || folderScope.archived || !testCase.archivedAt).length;
  const totalLabel = formatCount(locale, totalCount, ["test case", "test cases"], ["тест-кейс", "тест-кейса", "тест-кейсов"]);
  const countLabel = rows.length === totalCount
    ? totalLabel
    : `${rows.length} ${locale === "ru" ? "из" : "of"} ${totalLabel}`;
  const allEstimated = rows.length > 0 && rows.every((row) => row.testCase.estimatedMinutes !== null);
  const estimatedMinutes = rows.reduce((total, row) => total + (row.testCase.estimatedMinutes ?? 0), 0);
  const estimateLabel = allEstimated
    ? `${locale === "ru" ? "Оценка" : "Estimate"}: ${formatCaseEstimate(locale, estimatedMinutes)}`
    : (locale === "ru" ? "Оценка не указана" : "Estimate not specified");

  useEffect(() => {
    setFacetFilters((current) => {
      const next = sanitizeDependentCaseFacets(baseRows, current);
      return next.components.length === current.components.length ? current : next;
    });
  }, [baseRows, facetOptions.components]);

  useEffect(() => { if (props.editor) setDetailOpen(true); }, [props.editor]);
  useEffect(() => {
    setDetailOpen(Boolean(props.selectedCaseId));
  }, [props.selectedCaseId]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (filterOpen) setFilterOpen(false);
      else if (detailFullscreen) setDetailFullscreen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest("[data-case-popover-root]")) return;
      setFilterOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [detailFullscreen, filterOpen]);

  function toggleSort(key: CaseSortKey) {
    setSort((current) => current.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: key === "priority" ? "desc" : "asc" });
  }
  function selectRow(row: CaseListRow) {
    if (props.editor) return;
    if (row.folderPath !== props.selectedFolder || (row.testCase.folderId ?? "") !== (props.selectedFolderId ?? "")) props.onSelectFolder(row.folderPath, row.testCase.folderId ?? undefined);
    props.onSelectCase(row.testCase.id);
    setDetailOpen(true);
  }
  function createCase(folderPath?: string) {
    const path = folderPath ?? props.selectedFolder;
    const explicitFolderMissing = folderPath !== undefined && Boolean(props.folders) && path !== "/"
      && !props.folders!.items.some((folder) => folder.path === path && !folder.archivedAt);
    if (folderPath === undefined ? folderScope.archived : explicitFolderMissing) return;
    if (props.editor) {
      document.getElementById("case-editor-actions")?.focus();
      return;
    }
    setDetailOpen(true);
    setDetailFullscreen(false);
    props.onNew(path || "/");
  }
  function closeInspector() {
    props.editor?.onCancel();
    if (!props.editor) props.onSelectCase("");
    setDetailFullscreen(false);
    setDetailOpen(false);
  }
  function toggleSelectionMode() {
    setSelectionMode((current) => {
      if (current) bulkSelection.clear();
      return !current;
    });
  }

  return {
    folderArchived: folderScope.archived,
    folderEmpty,
    workspaceRef, inspectorResize, filterOpen, setFilterOpen, detailFullscreen,
    setDetailFullscreen, inspectorOpen: (detailOpen && Boolean(props.testCase)) || Boolean(props.editor), sort,
    toggleSort, qlQuery, setQlQuery, viewMode, setViewMode, groupBy, setGroupBy,
    facetFilters, setFacetFilters, facetOptions, rows, matchingRows, treeFiltered, countLabel, estimateLabel,
    selectRow, createCase, closeInspector, selectionMode, toggleSelectionMode,
    bulkSelection, selectableIds, setRepositoryArchived,
    selectableCount: selectableRows.length, selectableVisibleCount: selectableVisibleRows.length,
  };
}
