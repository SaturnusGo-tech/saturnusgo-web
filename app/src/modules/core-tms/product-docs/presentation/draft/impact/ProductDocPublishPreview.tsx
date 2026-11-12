"use client";

import { ErrorToast } from "../../../../presentation/common/error/ErrorToast";
import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { productDocErrorCode } from "../../../domain/errors/product-doc-response";
import type { ProductDocImpactCase } from "../../../domain/impact/product-doc-impact";
import type { ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import { useProductDocResource } from "../../../state/useProductDocResource";
import { ProductDocModal } from "../../overlay/ProductDocModal";
import chrome from "../../product-docs.module.css";
import styles from "./publish-preview.module.css";

export function ProductDocPublishPreview({ api, scope, docId, version, locale, isUpdate, busy = false, onClose, onPublish }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  docId: string;
  version: number;
  locale: TmsLocale;
  isUpdate: boolean;
  busy?: boolean;
  onClose(): void;
  onPublish(version: number): void;
}) {
  const ru = locale === "ru";
  const publishLabel = ru ? (isUpdate ? "Опубликовать изменения" : "Опубликовать")
    : (isUpdate ? "Publish changes" : "Publish");
  const reduceMotion = useReducedMotion();
  const [history, setHistory] = useState<{ cases: ProductDocImpactCase[]; cursor?: string }>({ cases: [] });
  const request = useMemo(() => (signal: AbortSignal) => api.getImpact(scope, docId, {
    draft: true, expectedDraftVersion: version, limit: 20, cursor: history.cursor, signal,
  }), [api, scope, docId, version, history.cursor]);
  const resource = useProductDocResource(request);
  const stale = resource.status === "error" && productDocErrorCode(resource.error) === "PRODUCT_DOC_STALE_DRAFT";
  const current = resource.status === "ready" ? resource.data : undefined;
  const lastReady = useRef<typeof current>(undefined);
  const impact = current ?? lastReady.current;
  useEffect(() => { if (current) lastReady.current = current; }, [current]);
  const cases = [...history.cases, ...(current?.cases ?? [])];
  const changes = impact?.changes;
  const changeLabel = ru ? { added: "Добавлен", edited: "Изменён", removed: "Удалён" }
    : { added: "Added", edited: "Edited", removed: "Removed" };

  return <ProductDocModal title={ru ? "Перед публикацией" : "Before publishing"}
    subtitle={ru ? "Проверьте изменения и связанные тест-кейсы." : "Review changes and related test cases."}
    closeLabel={ru ? "Закрыть" : "Close"} onClose={onClose} busy={busy} isDismissable={false}
    className={styles.dialog} bodyClassName={styles.body} footerClassName={styles.footer}
    footer={dismiss => <>
      <Button className={chrome.action} isDisabled={busy} onPress={dismiss}>{ru ? "К редактору" : "Back to editor"}</Button>
      <Button className={chrome.primary} isDisabled={busy || resource.status !== "ready" || !impact}
        onPress={() => onPublish(version)}>{publishLabel}</Button>
    </>}>
      <div aria-busy={resource.status === "loading" || busy}>
        {impact && changes && <>
          {impact.publishedVersion !== null && <p>{ru ? "Сравнение с версией" : "Compared with version"} {impact.publishedVersion}</p>}
          {changes.pageChanged && <p>{ru ? "Изменены свойства страницы" : "Page properties changed"}</p>}
          {changes.orderChanged && <p>{ru ? "Изменён порядок разделов" : "Section order changed"}</p>}
          {changes.sections.length > 0 && <Accordion className={styles.changes} showDivider={false}
            selectionMode="multiple" disableAnimation={Boolean(reduceMotion)}
            disabledKeys={changes.sections.filter((section) => !section.excerpt).map((section) => section.sectionId)}
            itemClasses={{ base: styles.change, heading: styles.changeHeading, trigger: styles.changeTrigger,
              titleWrapper: styles.changeTitleWrapper, title: styles.changeTitle, indicator: styles.changeIndicator }}>
            {changes.sections.map((section) => <AccordionItem key={section.sectionId}
              title={<><span>{section.title || (ru ? "Введение" : "Introduction")}</span><small>{changeLabel[section.kind]}</small></>}
              hideIndicator={!section.excerpt} indicator={<ChevronDown size={14} aria-hidden="true" />}>
              {section.excerpt && <div className={styles.comparison}>
                <div><h4>{ru ? "Было" : "Before"}</h4><p>{section.excerpt.before || (ru ? "Пусто" : "Empty")}</p></div>
                <div><h4>{ru ? "Стало" : "After"}</h4><p>{section.excerpt.after || (ru ? "Пусто" : "Empty")}</p></div>
              </div>}
            </AccordionItem>)}
          </Accordion>}
          {!changes.pageChanged && !changes.orderChanged && !changes.sections.length
            && <p>{ru ? "Содержимое совпадает с публикацией." : "The content matches the current publication."}</p>}
          <h3>{ru ? "Затронутые тест-кейсы" : "Potentially affected cases"} <span>{impact.affectedCases}</span></h3>
          {impact.affectedCases === 0
            ? <p>{ru ? "В связанных тест-кейсах нет потенциально затронутых." : "No linked test cases are affected by these changes."}</p>
            : <ul className={styles.rows}>{cases.filter(item => item.affected).map(item => <li key={item.caseId}>
              <span>{item.title}</span>
              {item.missingSection && <small>{ru ? "Раздел удалён" : "Section removed"}</small>}
            </li>)}</ul>}
        </>}
        {current?.nextCursor && <Button className={chrome.action}
          onPress={() => setHistory({ cases, cursor: current.nextCursor ?? undefined })}>{ru ? "Показать ещё" : "Show more"}</Button>}
        {resource.status === "loading" && <div className={styles.loading} role="status"><LoadingOrb />{ru ? "Проверяем связи…" : "Checking links…"}</div>}
        <ErrorToast message={resource.status === "error" ? (stale
            ? (ru ? "Черновик изменился. Откройте его актуальную версию." : "The draft changed. Reopen the latest version.")
            : (ru ? "Не удалось проверить этот черновик." : "Could not check this draft.")) : null}
          retryLabel={ru ? "Повторить" : "Retry"} onRetry={stale ? undefined : resource.retry} />
      </div>
  </ProductDocModal>;
}
