import { FileJson, LoaderCircle, Search } from "lucide-react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { MemberAvatar } from "../../../../../workspace/members/avatar/MemberAvatar";
import { useMemberDirectory } from "../../../../../workspace/members/state/directory/useMemberDirectory";
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
  const directory = useMemberDirectory(scope.workspaceId, true);
  const groups = groupImportHistory(history.items, new Date(), ru);
  return <section className={css.history} aria-label={ru ? "История файлов" : "File history"}>
    <header className={css.historyHeader}><h2>{ru ? "История файлов" : "File history"}</h2>
      <label className={css.search}><Search size={17} aria-hidden="true" /><input value={history.query} maxLength={200}
        onChange={event => history.setQuery(event.target.value)} placeholder={ru ? "Найти файл" : "Find a file"}
        aria-label={ru ? "Найти файл в истории" : "Find a file in history"} /></label></header>
    {actions.notice && <p className={css.notice} role="status">{actions.notice}</p>}
    {actions.error && !actions.deletion && !actions.preview && <p className={css.error} role="alert">{actions.error}</p>}
    {history.error && <p className={css.error} role="alert">{ru ? "Не удалось загрузить историю." : "Could not load history."} <button type="button" onClick={history.reload}>{ru ? "Повторить" : "Retry"}</button></p>}
    {directory.error && <button className={css.link} type="button" onClick={directory.retry}>{ru ? "Загрузить имена сотрудников" : "Load member names"}</button>}
    <div aria-busy={history.loading || history.searching}>
      {groups.map(group => <section className={css.day} key={group.key} aria-label={`${group.label} ${group.date}`}>
        <h3>{group.label && <strong>{group.label}</strong>}<span>{group.date}</span></h3>
        <ul className={css.fileList}>{group.items.map(file => {
          const name = directory.members.get(file.authorId)?.name ?? (ru ? "Участник команды" : "Team member");
          return <li className={css.fileRow} key={file.id} data-deleted={file.deleted || undefined}>
            <FileJson className={css.fileIcon} size={27} strokeWidth={1.4} aria-hidden="true" />
            <div className={css.fileInfo}><button type="button" disabled={!file.available || actions.pending} onClick={() => void actions.open(file)} title={file.fileName}>{file.fileName}</button>
              <span title={file.destinationPath}>{file.destinationPath === "/" ? (ru ? "Корень проекта" : "Project root") : file.destinationPath.replace(/^\//, "").split("/").join(" / ")} · {importFileSize(file.byteSize, ru)}{file.deleted ? (ru ? " · Файл удалён" : " · File deleted") : !file.available ? (ru ? " · Недоступен" : " · Unavailable") : ""}</span></div>
            <div className={css.author}><MemberAvatar identityId={file.authorId} name={name} /><div><span>{name}</span>
              <time dateTime={file.createdAt}>{new Date(file.createdAt).toLocaleString(ru ? "ru-RU" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div></div>
            <ImportFileMenu ru={ru} available={file.available} canDelete={canManage && !file.deleted} disabled={actions.pending}
              onOpen={() => void actions.open(file)} onDownload={() => void actions.download(file)} onShare={() => void actions.share(file)} onDelete={() => actions.requestDelete(file)} />
          </li>;
        })}</ul>
      </section>)}
    </div>
    {(history.loading || history.searching) && <p className={css.message} role="status"><LoaderCircle size={18} className={css.spin} />{ru ? "Загружаем файлы…" : "Loading files…"}</p>}
    {!history.loading && !history.searching && !history.error && !history.items.length && <p className={css.empty}>{history.query ? (ru ? "Файлы не найдены" : "No matching files") : (ru ? "Здесь появятся исходные файлы новых импортов." : "Original files from new imports will appear here.")}</p>}
    {history.cursor && <button type="button" className={css.more} disabled={history.loading} onClick={history.loadMore}>{ru ? "Загрузить ещё" : "Load more"}</button>}
    <ImportFileDialogs actions={actions} ru={ru} />
  </section>;
}
