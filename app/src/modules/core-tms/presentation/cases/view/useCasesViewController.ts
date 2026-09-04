import { useEffect, useMemo, useRef, useState } from "react";
import { formatCount } from "../../../localization/format/count";
import type { TmsLocale } from "../../../localization/model/locale";
import { readCaseDeepLink } from "../../../test-cases/navigation/case-deep-link";
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
  const [detailOpen, setDetailOpen] = useState(true);
  const [detailFullscreen, setDetailFullscreen] = useState(false);
  const [sort, setSort] = useState<CaseSort>({ key: "key", direction: "asc" });
  const [qlQuery, setQlQuery] = useState("");
  const [viewMode, setViewMode] = useState<CaseListViewMode>("list");
  const [groupBy, setGroupBy] = useState<CaseGroupBy>("none");
  const [selectionMode, setSelectionMode] = useState(false);
  const [facetFilters, setFacetFilters] = useState<CaseFacetFilters>({ folders: [], components: [] });
  const workspaceRef = useRef<HTMLDivElement>(null);
  const deepLinkOpenedRef = useRef(false);
  const inspectorResize = useCaseInspectorResize(workspaceRef);

  const allRows = useMemo<CaseListRow[]>(() => props.testCases.map((testCase) => ({
    testCase, folderPath: testCase.folderPath,
  })), [props.testCases]);
  const baseRows = useMemo(() => filterCaseRows(allRows.filter(({ testCase }) => (
    (props.filters.includeArchived || !testCase.archivedAt)
    && (props.filters.type === "all" || testCase.type === props.filters.type)
    && (props.filters.priority === "all" || testCase.priority === props.filters.priority)
    && (props.filters.lifecycle === "all" || testCase.lifecycle === props.filters.lifecycle)
    && (!props.filters.tag.trim() || testCase.tags.some((tag) => (
      tag.toLocaleLowerCase().includes(props.filters.tag.trim().toLocaleLowerCase())
    )))
  )), { titleQuery: props.query }), [allRows, props.filters, props.query]);
  const facetOptions = useMemo(
    () => resolveDependentCaseFacets(baseRows, facetFilters),
    [baseRows, facetFilters],
  );
  const rows = useMemo(() => sortCaseRows(filterCaseRows(baseRows, {
    qlQuery, facets: facetFilters,
  }), sort, languageTag), [baseRows, facetFilters, languageTag, qlQuery, sort]);
  const selectableRows = useMemo(() => allRows.filter(({ testCase }) => (
    !testCase.archivedAt && Boolean(testCase.etag)
  )), [allRows]);
  const selectableIds = useMemo(
    () => new Set(selectableRows.map(({ testCase }) => testCase.id)),
    [selectableRows],
  );
  const selectableVisibleRows = useMemo(
    () => rows.filter(({ testCase }) => selectableIds.has(testCase.id)),
    [rows, selectableIds],
  );
  const bulkSelection = useCaseBulkSelection(selectableRows, selectableVisibleRows);
  const totalLabel = formatCount(locale, allRows.length, ["test case", "test cases"], ["тест-кейс", "тест-кейса", "тест-кейсов"]);
  const countLabel = rows.length === allRows.length
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
    if (deepLinkOpenedRef.current) return;
    const linkedCaseId = readCaseDeepLink(window.location.href).caseId;
    if (!linkedCaseId) { deepLinkOpenedRef.current = true; return; }
    if (linkedCaseId !== props.testCase?.id) return;
    deepLinkOpenedRef.current = true;
    setDetailOpen(true);
  }, [props.testCase?.id]);
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
    if (row.folderPath !== props.selectedFolder) props.onSelectFolder(row.folderPath);
    props.onSelectCase(row.testCase.id);
    setDetailOpen(true);
  }
  function createCase(folderPath = props.selectedFolder) {
    if (props.editor) {
      document.getElementById("case-editor-actions")?.focus();
      return;
    }
    setDetailOpen(true);
    setDetailFullscreen(false);
    props.onNew(folderPath);
  }
  function closeInspector() {
    props.editor?.onCancel();
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
    workspaceRef, inspectorResize, filterOpen, setFilterOpen, detailFullscreen,
    setDetailFullscreen, inspectorOpen: detailOpen || Boolean(props.editor), sort,
    toggleSort, qlQuery, setQlQuery, viewMode, setViewMode, groupBy, setGroupBy,
    facetFilters, setFacetFilters, facetOptions, rows, countLabel, estimateLabel,
    selectRow, createCase, closeInspector, selectionMode, toggleSelectionMode,
    bulkSelection, selectableIds,
    selectableCount: selectableRows.length,
  };
}
