import { Button } from "@heroui/react";
import { ChevronRight, Database, KeyRound, Plus, Braces } from "lucide-react";
import { useId, type ReactNode } from "react";
import { useDisclosureMotion } from "../../../presentation/common/disclosure/useDisclosureMotion";
import { DataFeedback } from "../shared/DataFeedback";
import css from "./resource-tree.module.css";

type Resource = { readonly id: string; readonly name: string };
type Props<T extends Resource> = { kind: "datasets" | "credentials" | "static" | "values"; label: string; open: boolean; ru: boolean; canCreate?: boolean;
  items: readonly T[]; loading: boolean; pending: boolean; error: boolean; cursor: string | null;
  selectedId?: string; search: string; toggle(): void; create(): void; select(resource: T): void; renderResource?(resource: T): ReactNode; retry(): void; more(): Promise<void> };
export function ResourceBranch<T extends Resource>(props: Props<T>) {
  const id = useId(), motion = useDisclosureMotion(props.open, true);
  const Icon = props.kind === "credentials" ? KeyRound : props.kind === "static" ? Braces : Database;
  const createLabel = props.kind === "credentials" ? (props.ru ? "Создать учётные данные" : "Create credential") : props.kind === "static" ? (props.ru ? "Создать значение" : "Create static data") : (props.ru ? "Создать набор" : "Create dataset");
  return <div className={css.branch}>
    <div className={css.category}>
      <Button aria-label={props.label} aria-expanded={props.open} aria-controls={id} onPress={props.toggle} className={css.categoryTrigger}>
        <ChevronRight size={14} className={css.chevron} data-open={props.open} aria-hidden="true" />
        <span>{props.label}</span>
      </Button>
      {props.canCreate && <Button isIconOnly aria-label={createLabel} className={css.add} onPress={props.create}><Plus size={15} /></Button>}
    </div>
    <div ref={motion.ref} id={id} className={css.disclosure}>
      {motion.present && <div className={css.children}>
        <DataFeedback loading={props.loading} error={props.error} ru={props.ru} retry={props.retry} />
        {!props.loading && props.items.map(resource => props.renderResource ? <div key={resource.id}>{props.renderResource(resource)}</div> : <Button key={resource.id} aria-label={`${props.ru ? "Открыть" : "Open"} ${resource.name}`}
          aria-current={props.selectedId === resource.id ? "page" : undefined} className={css.resource} onPress={() => props.select(resource)}>
          <Icon size={15} aria-hidden="true" /><span>{resource.name}</span>
          {"currentVersion" in resource && typeof resource.currentVersion === "number" && <small>v{resource.currentVersion}</small>}
        </Button>)}
        {!props.loading && !props.error && !props.items.length && <p className={css.empty}>{props.search
          ? (props.ru ? "Ничего не найдено" : "No matching resources")
          : (props.ru ? "Ресурсов пока нет" : "No resources yet")}</p>}
        {props.cursor && <Button className={css.more} isLoading={props.pending} onPress={() => void props.more()}>{props.ru ? "Показать ещё" : "Load more"}</Button>}
        {props.canCreate && <Button className={css.newResource} startContent={<Plus size={14} />} onPress={props.create}>{props.ru ? "Новые тестовые данные" : "New test data"}</Button>}
      </div>}
    </div>
  </div>;
}
