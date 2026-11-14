import { Button } from "@heroui/react";
import { useCallback } from "react";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCatalog } from "../../application/catalog/useDataCatalog";
import { DataFeedback } from "../shared/DataFeedback";
import css from "../shared/data.module.css";
export function ResourceUsage({ kind, id, ru, onOpenCase }: { kind: "datasets" | "credentials"; id: string; ru: boolean; onOpenCase?(id: string): void }) {
  const feature = useTestData();
  const load = useCallback((_search: string, cursor: string | null, signal: AbortSignal) => feature!.port.usage(kind, id, cursor, signal), [feature, kind, id]);
  const usage = useDataCatalog(feature ? load : null);
  return <section><h3>{ru ? "Связанные тест-кейсы" : "Used in test cases"}</h3>
    <DataFeedback loading={usage.loading} error={usage.error} ru={ru} retry={usage.refresh} />
    <ul className={css.rows}>{usage.items.map(item => <li key={item.id} className={css.row}>
      {onOpenCase ? <Button className={`${css.button} ${css.quiet}`} onPress={() => onOpenCase(item.id)}>{item.title}</Button> : <span className={css.name}>{item.title}</span>}
      <span className={css.muted}>{item.key}</span></li>)}</ul>
    {!usage.loading && !usage.error && !usage.items.length && <p className={css.muted}>{ru ? "Ресурс пока не связан с тест-кейсами." : "No test cases use this resource yet."}</p>}
    {usage.cursor && <Button className={`${css.button} ${css.quiet}`} isLoading={usage.pending} onPress={() => void usage.more()}>{ru ? "Показать ещё" : "Load more"}</Button>}
  </section>;
}
