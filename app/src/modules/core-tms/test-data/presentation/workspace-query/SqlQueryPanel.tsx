import { Button } from "@heroui/react";
import { useEffect, useRef } from "react";
import { Code2, Play } from "lucide-react";
import { useTestData } from "../../application/context/TestDataContext";
import { useSourceQuery } from "../../application/workspace-query/useSourceQuery";
import { DataFeedback } from "../shared/DataFeedback";
import { DataResultTable } from "../workspace-table/DataResultTable";
import { SqlQueryEditor } from "./editor/SqlQueryEditor";
import css from "./query-panel.module.css";

export function SqlQueryPanel({ sourceIds, query, onChange, ru, autoRun = false }: { sourceIds: readonly string[]; query: string; onChange(value: string): void; ru: boolean; autoRun?: boolean }) {
  const feature = useTestData(), state = useSourceQuery(feature?.permissions.read ? feature.workspace : undefined, sourceIds);
  const canRun = Boolean(feature?.permissions.read && feature.workspace && sourceIds.length && query.trim());
  const latestQuery = useRef(query), run = useRef(state.run); latestQuery.current = query; run.current = state.run;
  const identity = sourceIds.join("\0");
  useEffect(() => { if (autoRun && latestQuery.current.trim()) void run.current(latestQuery.current); }, [autoRun, identity]);
  return <section className={css.section} aria-label={ru ? "SQL-запрос" : "SQL query"}>
    <div className={css.results}>{state.result ? <DataResultTable table={state.result} ru={ru} label={ru ? "Результат запроса" : "Query results"}
      pagination={{ index: state.page, hasNext: state.result.hasMore, busy: state.pending, onChange: state.changePage }} />
      : !state.pending && !state.error && <p className={css.empty}>{ru ? "Выполните запрос, чтобы посмотреть данные" : "Run a query to explore your data"}</p>}
      <div className={state.result ? css.feedback : css.initialFeedback}><DataFeedback loading={state.pending} error={state.error} ru={ru} retry={state.retry} /></div>
    </div>
    <div className={css.query}><header className={css.header}><span><Code2 size={16} />{ru ? "Запрос" : "Query"}</span><div className={css.actions}>
      <kbd className={css.shortcut}>⌘ ↵</kbd><Button type="button" disableRipple className={css.run} isDisabled={!canRun || state.pending} isLoading={state.pending}
        onPress={() => void state.run(query)} startContent={<Play size={13} />}>{ru ? "Выполнить" : "Run"}</Button></div></header>
      <SqlQueryEditor value={query} onChange={onChange} label={ru ? "SQL-запрос" : "SQL query"} disabled={!feature?.permissions.read || !sourceIds.length}
        onRun={() => { if (canRun) void state.run(query); }} />
      <p className={css.hint}>{ru ? "Только чтение" : "Read only"}</p>
    </div>
  </section>;
}
