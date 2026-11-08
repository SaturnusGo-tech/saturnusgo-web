"use client";

import { Button, DrawerBody, DrawerFooter, Input, Listbox, ListboxItem, ListboxSection, Skeleton, Spinner } from "@heroui/react";
import { Check, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldPage } from "../../../../../custom-fields/state/list/useFieldPage";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { parseCaseQuery } from "../../../../../presentation/cases/model/query/parse";
import { DetailStatus } from "../../../../../presentation/dashboard/detail/records/RecordSignals";
import { emptyRunFilters, type RunFilterState } from "../../../../../presentation/runs/filters/run-filter-model";
import { useWorkspaceMembers } from "../../../../../workspace/members/state/useWorkspaceMembers";
import type { CaptureProductDocRunInput, RunEvidenceCandidate, RunEvidencePage, RunEvidenceQuery } from "../../../../domain/run/productDocRunCandidates";
import type { ProductDocScope } from "../../../../domain/product-docs";
import { groupRunEvidence, type RunEvidenceGroup } from "../../../../state/run/catalog/runEvidenceGroups";
import { useRunEvidenceCatalog } from "../../../../state/run/catalog/useRunEvidenceCatalog";
import { runSnapshotPattern } from "../../markdown/runDirective";
import { RunEvidenceQuery as RunEvidenceQueryControl } from "./query/RunEvidenceQuery";
import { RunEvidenceFilters, runEvidenceFilterCount } from "./RunEvidenceFilters";
import styles from "./run-evidence-inspector.module.css";

const spinnerSlots = { base: styles.spinner, wrapper: styles.spinnerWheel, circle1: styles.spinnerTrack };

type Props = {
  scope: ProductDocScope;
  load(query: RunEvidenceQuery, cursor: string | null, signal: AbortSignal): Promise<RunEvidencePage>;
  capture(input: CaptureProductDocRunInput, signal: AbortSignal): Promise<string>;
  onChoose(id: string): void;
};

export function RunEvidencePicker({ scope, load, capture, onChoose }: Props) {
  const { locale, languageTag } = useTmsLocale();
  const ru = locale === "ru";
  const [filters, setFilters] = useState(emptyRunFilters);
  const [grouping, setGrouping] = useState<RunEvidenceGroup | null>("project");
  const [ql, setQl] = useState("");
  const [debouncedQl, setDebouncedQl] = useState("");
  const [overlay, setOverlay] = useState<"ql" | "filters" | null>(null);
  const qlOpen = overlay === "ql";
  const filtersOpen = overlay === "filters";
  const [choice, setChoice] = useState("");
  const [capturePending, setCapturePending] = useState(false);
  const [captureFailed, setCaptureFailed] = useState(false);
  const captureRequest = useRef<AbortController | null>(null);
  const command = useRef<CaptureProductDocRunInput>(null);
  const list = useRef<HTMLElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const shortDate = new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short" });
  const fullDate = new Intl.DateTimeFormat(languageTag, { dateStyle: "medium" });
  const invalidQl = Boolean(parseCaseQuery(ql).error);
  const waitingForQl = !invalidQl && ql !== debouncedQl;
  const loadPage = useCallback(async (q: string, cursor: string | null, signal: AbortSignal) => {
    const page = await load({ ...filters, q, ql: debouncedQl }, cursor, signal);
    return { items: page.items, nextCursor: page.nextCursor };
  }, [filters, debouncedQl, load]);
  const page = useFieldPage(loadPage, true);
  const folderCatalog = useRunEvidenceCatalog(scope, filters.projects, qlOpen ? "folders" : undefined);
  const members = useWorkspaceMembers(scope.workspaceId, qlOpen);
  const tags = useMemo(() => [...new Set([...filters.tags, ...page.items.flatMap((run) => run.tags)])], [filters.tags, page.items]);
  const components = useMemo(() => [...new Set([...filters.components, ...page.items.flatMap((run) => run.components)])], [filters.components, page.items]);
  const groups = useMemo(() => groupRunEvidence(page.items, grouping, ru ? "Без значения" : "Unspecified"), [page.items, grouping, ru]);
  const selected = groups.flatMap((group) => group.rows).find((row) => row.id === choice)?.run;
  const loading = page.loading || page.pending || waitingForQl;
  const searchActive = Boolean(page.search.trim() || debouncedQl.trim() || runEvidenceFilterCount(filters));

  useEffect(() => {
    if (invalidQl) return;
    const timeout = window.setTimeout(() => setDebouncedQl(ql), ql ? 180 : 0);
    return () => window.clearTimeout(timeout);
  }, [invalidQl, ql]);
  useEffect(() => () => captureRequest.current?.abort(), []);

  function toggleOverlay(tool: "ql" | "filters", open: boolean) {
    setOverlay((current) => open ? tool : current === tool ? null : current);
  }

  function clearSelection() {
    setChoice("");
    setCaptureFailed(false);
  }

  function changeFilters(next: RunFilterState) {
    clearSelection();
    const group = next.groups[0];
    setGrouping(group === "project" || group === "component" || group === "tag" ? group : null);
    setFilters((current) => Object.keys(current).every((field) => field === "groups"
      || current[field as keyof RunFilterState] === next[field as keyof RunFilterState]) ? current : next);
  }

  async function submit() {
    if (!selected || captureRequest.current || loading || (qlOpen && invalidQl)) return;
    const controller = new AbortController();
    if (command.current?.runId !== selected.id || command.current?.runProjectId !== selected.projectId) {
      command.current = { runId: selected.id, runProjectId: selected.projectId, commandId: crypto.randomUUID() };
    }
    captureRequest.current = controller;
    setCapturePending(true);
    setCaptureFailed(false);
    try {
      const id = await capture(command.current, controller.signal);
      if (!runSnapshotPattern.test(id)) throw new Error("Invalid run snapshot ID");
      if (!controller.signal.aborted) onChoose(id);
    } catch {
      if (!controller.signal.aborted) setCaptureFailed(true);
    } finally {
      captureRequest.current = null;
      if (!controller.signal.aborted) setCapturePending(false);
    }
  }

  function itemLabel(run: RunEvidenceCandidate) {
    const context = [grouping !== "project" ? run.projectName : "", run.environmentName].filter(Boolean).join(" · ");
    const created = Number.isFinite(Date.parse(run.createdAt)) ? new Date(run.createdAt) : null;
    return <>
      <span className={styles.runKey} title={run.key}>{run.key}</span>
      <strong className={styles.runTitle} title={run.name}>{run.name}</strong>
      <span className={styles.runContext} title={context}>{context}</span>
      <span className={styles.runStatus}><DetailStatus status={run.status} /></span>
      {created && <time className={styles.runDate} dateTime={run.createdAt} title={fullDate.format(created)}>{shortDate.format(created)}</time>}
    </>;
  }

  const loadingLabel = ru ? "Загружаем прогоны…" : "Loading runs…";
  return <>
    <div className={styles.body}>
      <DrawerBody as="p" className={styles.description}>{ru ? "Результаты сохранятся на момент вставки."
        : "The snapshot preserves the results at insertion."}</DrawerBody>
      <div className={styles.search} data-input-shell>
        <Input ref={search} autoFocus type="search" size="sm" aria-label={ru ? "Найти прогон по названию или ID" : "Find a run by name or ID"}
          classNames={{ base: styles.input, inputWrapper: styles.inputWrapper, innerWrapper: styles.inputInner }}
          startContent={<Search size={16} aria-hidden="true" />}
          placeholder={ru ? "Название или ID…" : "Name or ID…"} value={page.search} isDisabled={capturePending}
          onValueChange={(value) => { page.setSearch(value); clearSelection(); }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown") return;
            const first = list.current?.querySelector<HTMLElement>('[role="option"]:not([aria-disabled="true"])');
            if (first) { event.preventDefault(); first.focus(); }
          }} />
        <RunEvidenceQueryControl locale={locale} query={ql} open={qlOpen} instantClose={filtersOpen} disabled={capturePending}
          onOpenChange={(open) => toggleOverlay("ql", open)} onQuery={(value) => { setQl(value); clearSelection(); }}
          folders={folderCatalog.status === "ready" ? folderCatalog.data.map(({ value }) => value) : []}
          components={components} members={members.items} tags={tags} />
        <RunEvidenceFilters scope={scope} locale={locale} disabled={capturePending} tags={tags} components={components}
          open={filtersOpen} instantClose={qlOpen} onOpenChange={(open) => toggleOverlay("filters", open)}
          filters={{ ...filters, groups: grouping ? [grouping] : [] }} onChange={changeFilters} />
      </div>
      <div className={styles.results} aria-busy={loading}
        onKeyDownCapture={(event) => {
          if (event.key !== "ArrowUp" || event.target !== list.current?.querySelector('[role="option"]')) return;
          event.preventDefault();
          event.stopPropagation();
          search.current?.focus();
        }}>
        <Listbox ref={list} classNames={{ base: styles.listbox, list: styles.list }}
          itemClasses={{ base: styles.option, title: styles.runLabel, selectedIcon: styles.optionIcon }}
          aria-label={ru ? "Доступные прогоны" : "Available runs"} items={groups}
          disabledKeys={capturePending ? groups.flatMap(({ rows }) => rows.map((row) => row.id)) : []}
          selectionMode="single" selectedKeys={choice ? [choice] : []} disallowEmptySelection hideEmptyContent
          variant="flat" onSelectionChange={(keys) => {
            if (keys === "all") return;
            const [key] = keys;
            if (typeof key === "string") { setChoice(key); setCaptureFailed(false); }
          }}>
          {(section) => <ListboxSection key={section.id || "runs"} title={section.label || undefined} items={section.rows}
            classNames={{ heading: styles.groupHeading, group: styles.list }}>
            {(row) => <ListboxItem key={row.id} textValue={`${row.run.name} ${row.run.key}`}
              selectedIcon={({ isSelected }) => isSelected ? <Check size={15} aria-hidden="true" />
                : <ChevronRight size={15} aria-hidden="true" />}>
              {itemLabel(row.run)}
            </ListboxItem>}
          </ListboxSection>}
        </Listbox>
        {!loading && !page.failure && page.items.length === 0 && <div className={styles.empty} role="status">
          {searchActive ? (ru ? "Совпадений нет." : "No matching runs.") : (ru ? "Нет доступных прогонов." : "No available runs.")}
        </div>}
        {loading && (page.items.length === 0
          ? <div className={styles.pending} role="status" aria-label={loadingLabel}>
            {[0, 1].map((row) => <div key={row}><Skeleton className={styles.skeleton} disableAnimation /><Skeleton className={styles.skeleton} disableAnimation /></div>)}
          </div>
          : <div className={styles.empty} role="status"><Spinner variant="simple" classNames={spinnerSlots} aria-hidden="true" />{loadingLabel}</div>)}
        {Boolean(page.failure) && <div className={styles.empty} role="alert">
          {ru ? "Не удалось загрузить прогоны." : "Couldn’t load runs."}
          <Button disableRipple variant="light" size="sm" isDisabled={capturePending} onPress={() => page.cursor ? void page.more() : page.refresh()}>{ru ? "Повторить" : "Retry"}</Button>
        </div>}
        {page.cursor && !loading && !page.failure && <Button disableRipple variant="light" size="sm" className={styles.more} isDisabled={capturePending}
          onPress={() => void page.more()} endContent={<ChevronDown size={15} aria-hidden="true" />}>{ru ? "Показать ещё" : "Show more"}</Button>}
      </div>
      {captureFailed && <div className={styles.error} role="alert">
        {ru ? "Не удалось сохранить снимок. Попробуйте ещё раз." : "Couldn’t save the snapshot. Try again."}
      </div>}
    </div>
    <DrawerFooter as="footer" className={styles.footer}>
      <Button disableRipple className={styles.submit} size="sm" isDisabled={!selected || capturePending || loading || (qlOpen && invalidQl)} onPress={() => void submit()}
        startContent={capturePending ? <Spinner variant="simple" classNames={spinnerSlots} aria-hidden="true" /> : undefined}>
        {capturePending ? ru ? "Сохраняем…" : "Capturing…" : ru ? "Вставить снимок" : "Insert snapshot"}
      </Button>
    </DrawerFooter>
  </>;
}
