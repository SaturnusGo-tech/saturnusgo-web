import { ErrorToast } from "../../../../../presentation/common/error/ErrorToast";
import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import { FileJson, Inbox } from "lucide-react";
import { useRef } from "react";
import { AnimatedSearch } from "../../../../../presentation/common/search/AnimatedSearch";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { ResponsibleName } from "../../../../../workspace/members/presentation/ResponsibleName";
import { useImportHistory } from "../../state/useImportHistory";
import { useImportFileActions } from "../../state/useImportFileActions";
import { groupImportHistory, importFileSize } from "../../model/history-groups";
import type { ImportScope } from "../../model/import-file";
import { ImportFileMenu } from "../menu/ImportFileMenu";
import { ImportFileDialogs } from "../preview/ImportFileDialogs";
import css from "../page/import-page.module.css";

export function ImportHistory({ scope, revision, canManage }: { scope: ImportScope; revision: number; canManage: boolean }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const history = useImportHistory(scope, revision);
  const actions = useImportFileActions(scope, ru, canManage, history.reload);
  const groups = groupImportHistory(history.items, new Date(), ru);
  const scopeKey = `${scope.workspaceId}:${scope.projectId}`;
  const searchable = useRef({ scope: scopeKey, available: false });
  if (searchable.current.scope !== scopeKey) searchable.current = { scope: scopeKey, available: false };
  if (!history.loading && !history.searching && !history.error && !history.query.trim()) searchable.current.available = history.items.length > 0;
  const showSearch = searchable.current.available || history.items.length > 0 || Boolean(history.query);
  return <section className={css.history} aria-label={ru ? "История файлов" : "File history"}>
    <header className={css.historyHeader}><h2>{ru ? "История файлов" : "File history"}</h2>
      {showSearch && <AnimatedSearch value={history.query} onChange={history.setQuery}
        label={ru ? "Найти файл в истории" : "Find a file in history"} placeholder={ru ? "Найти файл" : "Find a file"}
        closeLabel={ru ? "Закрыть поиск" : "Close search"}/>}</header>
    {actions.notice && <p className={css.notice} role="status">{actions.notice}</p>}
    <ErrorToast message={!actions.deletion && !actions.preview ? actions.error : null} />
    <ErrorToast message={history.error ? (ru ? "Не удалось загрузить историю." : "Could not load history.") : null}
      retryLabel={ru ? "Повторить" : "Retry"} onRetry={history.reload} />
    <div aria-busy={history.loading || history.searching}>
      {groups.map(group => <section className={css.day} key={group.key} aria-label={`${group.label} ${group.date}`}>
        <h3>{group.label && <strong>{group.label}</strong>}<span>{group.date}</span></h3>
        <ul className={css.fileList}>{group.items.map(file => {
          return <li className={css.fileRow} key={file.id} data-deleted={file.deleted || undefined}>
            <FileJson className={css.fileIcon} size={23} strokeWidth={1.4} aria-hidden="true" />
            <div className={css.fileInfo}><button type="button" disabled={!file.available || actions.pending} onClick={() => void actions.open(file)} title={file.fileName}>{file.fileName}</button>
              <span title={file.destinationPath}>{file.destinationPath === "/" ? (ru ? "Корень проекта" : "Project root") : file.destinationPath.replace(/^\//, "").split("/").join(" / ")} · {importFileSize(file.byteSize, ru)}{file.deleted ? (ru ? " · Файл удалён" : " · File deleted") : !file.available ? (ru ? " · Недоступен" : " · Unavailable") : ""}</span></div>
            <div className={css.author}><div><ResponsibleName workspaceId={scope.workspaceId} identityId={file.authorId} />
              <time dateTime={file.createdAt}>{new Date(file.createdAt).toLocaleString(ru ? "ru-RU" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div></div>
            <ImportFileMenu ru={ru} available={file.available} canDelete={canManage && !file.deleted} disabled={actions.pending}
              onOpen={() => void actions.open(file)} onDownload={() => void actions.download(file)} onShare={() => void actions.share(file)} onDelete={() => actions.requestDelete(file)} />
          </li>;
        })}</ul>
      </section>)}
    </div>
    {(history.loading || history.searching) && <p className={css.message} role="status"><LoadingOrb size="md" />{ru ? "Загружаем файлы…" : "Loading files…"}</p>}
    {!history.loading && !history.searching && !history.error && !history.items.length && <div className={css.empty} role="status"><Inbox size={36} strokeWidth={1.2} aria-hidden="true" />
      <h3>{history.query ? (ru ? "Файлы не найдены" : "No matching files") : (ru ? "Пока нет импортов" : "No imports yet")}</h3>
      <p>{history.query ? (ru ? "Попробуйте изменить поисковый запрос." : "Try a different search.") : (ru ? "Здесь появятся исходные файлы новых импортов." : "Original files from new imports will appear here.")}</p></div>}
    {history.cursor && <button type="button" className={css.more} disabled={history.loading} onClick={history.loadMore}>{ru ? "Загрузить ещё" : "Load more"}</button>}
    <ImportFileDialogs actions={actions} ru={ru} />
  </section>;
}
