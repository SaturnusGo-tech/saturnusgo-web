import { Button } from "@heroui/react";
import { ChevronRight, Database, Table2 } from "lucide-react";
import { useId, useState } from "react";
import { useDisclosureMotion } from "../../../presentation/common/disclosure/useDisclosureMotion";
import type { DataSource, DatasetView, WorkspaceDataset } from "../../model/workspace/data-workspace";
import css from "../resource-tree/resource-tree.module.css";
export function DatasetNode({ dataset, ru, selectedId, select, selectSource, selectView }: {
  dataset: WorkspaceDataset; ru: boolean; selectedId?: string; select(value: WorkspaceDataset): void;
  selectSource(dataset: WorkspaceDataset, source: DataSource): void; selectView(dataset: WorkspaceDataset, view: DatasetView): void;
}) {
  const [open, setOpen] = useState(selectedId === dataset.id), id = useId(), motion = useDisclosureMotion(open, true);
  return <div><div className={css.nodeRow}>
    <Button isIconOnly disableRipple className={css.expand} aria-label={`${ru ? "Раскрыть" : "Expand"} ${dataset.name}`} aria-controls={id} aria-expanded={open} onPress={() => setOpen(value => !value)}>
      <ChevronRight size={13} className={css.chevron} data-open={open} /></Button>
    <Button disableRipple className={css.resource} aria-label={`${ru ? "Открыть" : "Open"} ${dataset.name}`} aria-current={selectedId === dataset.id ? "page" : undefined} onPress={() => { setOpen(true); select(dataset); }}>
      <Database size={15} /><span>{dataset.name}</span></Button></div>
    <div id={id} ref={motion.ref} className={css.disclosure}>{motion.present && <div className={css.nested}>
      {dataset.sources.map(source => <Button disableRipple key={source.id} className={css.resource} aria-label={`${ru ? "Открыть источник" : "Open source"} ${source.name}`} aria-current={selectedId === source.id ? "page" : undefined} onPress={() => selectSource(dataset, source)}><Database size={14} /><span>{source.name}</span></Button>)}
      {dataset.views.map(view => <Button disableRipple key={view.id} className={css.resource} aria-label={`${ru ? "Открыть представление" : "Open view"} ${view.name}`} aria-current={selectedId === view.id ? "page" : undefined} onPress={() => selectView(dataset, view)}><Table2 size={14} /><span>{view.name}</span></Button>)}
      {!dataset.sources.length && !dataset.views.length && <p className={css.empty}>{ru ? "Нет источников и представлений" : "No sources or views yet"}</p>}
    </div>}</div>
  </div>;
}
