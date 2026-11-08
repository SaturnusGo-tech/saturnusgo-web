"use client";

import { ListChecks, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { TmsLocale } from "../../../localization/model/locale";
import type { ProductDocImpactCase } from "../../domain/impact/product-doc-impact";
import type { DraftProductDocRequirement, ProductDocDetail, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocResource } from "../../state/useProductDocResource";
import styles from "../product-docs.module.css";

type Props = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  sectionId?: string;
  onOpenCase?: (location: { projectId: string; caseId: string }) => void;
  onCreateCase?(requirement: DraftProductDocRequirement): void;
};

export function RelatedCases(props: Props) {
  return <Coverage key={props.document.id + ":" + (props.sectionId ?? "")} {...props} />;
}

function Coverage({ api, scope, document, copy, locale, sectionId, onOpenCase, onCreateCase }: Props) {
  const { workspaceId, projectId } = scope;
  const { id, sections } = document;
  const ru = locale === "ru";
  const selected = sections.find(section => section.id === sectionId);
  const [history, setHistory] = useState<{ cases: ProductDocImpactCase[]; cursor?: string }>({ cases: [] });
  const request = useMemo(() => (signal: AbortSignal) => api.getImpact(
    { workspaceId, projectId }, id, { signal, sectionId: selected?.id, cursor: history.cursor },
  ), [api, workspaceId, projectId, id, selected?.id, history.cursor]);
  const resource = useProductDocResource(request);
  const current = resource.status === "ready" ? resource.data : undefined;
  const nextCursor = current?.nextCursor;
  const cases = new Map([...history.cases, ...(current?.cases ?? [])].map(testCase => [testCase.caseId, testCase]));
  return <section className={styles.related}>
    <h2>{selected ? (ru ? "Кейсы раздела" : "Section coverage") : copy.relatedCases}
      {current && ` · ${current.totalLinkedCases}`}</h2>
    {Boolean(current?.casesNeedingUpdate) && <p>{current?.casesNeedingUpdate} {ru ? "с отметкой «Нужно обновить»" : "flagged for update"}</p>}
    {resource.status === "loading" && <p role="status">{copy.loading}</p>}
    {resource.status === "error" && <button type="button" className={styles.action} onClick={resource.retry}>{copy.retry}</button>}
    {cases.size > 0
      ? <ul>{[...cases.values()].map(testCase => {
        const section = sections.find(candidate => candidate.id === testCase.sectionId)?.title;
        const label = <><ListChecks size={15} aria-hidden="true" />
          <span>{testCase.title}
            {section && !selected && <small>{section}</small>}
            {testCase.missingSection && <small>{ru ? "Раздел удалён" : "Section removed"}</small>}
            {testCase.needsUpdate && <small>{ru ? "Нужно обновить" : "Needs update"}</small>}
          </span></>;
        return <li key={testCase.caseId}>
          {onOpenCase
            ? <button type="button" onClick={() => onOpenCase({ projectId, caseId: testCase.caseId })}>{label}</button>
            : <div>{label}</div>}
        </li>;
      })}</ul>
      : current && <p>{copy.noRelatedCases}</p>}
    {nextCursor && <button type="button" className={styles.action}
      onClick={() => setHistory({ cases: [...cases.values()], cursor: nextCursor })}>{copy.more}</button>}
    {selected && onCreateCase && <button type="button" className={styles.action}
      onClick={() => onCreateCase({ docId: id, title: document.title, sectionId: selected.id, sectionTitle: selected.title })}>
      <Plus size={14} />{ru ? "Создать кейс" : "Create test case"}
    </button>}
  </section>;
}
