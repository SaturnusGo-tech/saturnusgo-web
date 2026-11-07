"use client";

import { ListChecks } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProductDocCase, ProductDocDetail, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocResource } from "../../state/useProductDocResource";
import styles from "../product-docs.module.css";

export function RelatedCases({ api, scope, document, copy, onOpenCase }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  copy: ProductDocsCopy;
  onOpenCase?: (location: { projectId: string; caseId: string }) => void;
}) {
  const { workspaceId, projectId } = scope;
  const { id, sections } = document;
  const [history, setHistory] = useState<{ cases: ProductDocCase[]; cursor?: string }>({ cases: [] });
  const request = useMemo(() => (signal: AbortSignal) => api.listArticleCases(
    { workspaceId, projectId }, id, { signal, cursor: history.cursor },
  ), [api, workspaceId, projectId, id, history.cursor]);
  const resource = useProductDocResource(request);
  const current = resource.status === "ready" ? resource.data : undefined;
  const nextCursor = current?.nextCursor;
  const keyOf = (testCase: ProductDocCase) => JSON.stringify([testCase.caseId, testCase.sectionId]);
  const cases = new Map([...history.cases, ...(current?.cases ?? [])].map((testCase) => [keyOf(testCase), testCase]));
  return <section className={styles.related}>
    <h2>{copy.relatedCases}</h2>
    {resource.status === "loading" && <p role="status">{copy.loading}</p>}
    {resource.status === "error" && <button type="button" className={styles.action} onClick={resource.retry}>{copy.retry}</button>}
    {cases.size > 0
        ? <ul>{[...cases.values()].map((testCase) => {
          const section = sections.find((candidate) => candidate.id === testCase.sectionId)?.title;
          const label = <><ListChecks size={15} aria-hidden="true" />
            <span>{testCase.title}{section && <small>{section}</small>}</span></>;
          return <li key={keyOf(testCase)}>
            {onOpenCase
              ? <button type="button" onClick={() => onOpenCase({ projectId, caseId: testCase.caseId })}>{label}</button>
              : <div>{label}</div>}
          </li>;
        })}</ul>
        : current && <p>{copy.noRelatedCases}</p>}
    {nextCursor && <button type="button" className={styles.action}
      onClick={() => setHistory({ cases: [...cases.values()], cursor: nextCursor })}>{copy.more}</button>}
  </section>;
}
