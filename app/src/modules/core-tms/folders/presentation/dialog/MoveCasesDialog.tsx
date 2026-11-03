import { useEffect, useRef, useState, type FormEvent } from "react";
import { PiArrowLeft, PiArrowRight } from "react-icons/pi";
import { ParentFolderPicker } from "../../../presentation/dialogs/folder/parent/ParentFolderPicker";
import { FolderBreadcrumb } from "../../../presentation/dialogs/folder/breadcrumb/FolderBreadcrumb";
import type { FolderResource } from "../../model/folder";
import css from "../move-browser/move-browser.module.css";

export function MoveCasesDialog({ resource, ids, ru, onClose, onMoved }: {
  resource: FolderResource; ids: readonly string[]; ru: boolean; onClose: () => void; onMoved: () => void;
}) {
  const [target, setTarget] = useState<{ path: string; id: string | null }>({ path: "/", id: null });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const busy = resource.busy || saving;
  useEffect(() => { heading.current?.focus(); }, []);
  const options = [{ value: "/", label: ru ? "Без папки" : "Unfiled" }, ...resource.items.filter(item => !item.archivedAt).map(item => ({ value: item.path, label: item.path }))];
  function cancel() { if (!busy && !pending.current) onClose(); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || pending.current || !resource.canManage || !ids.length) return;
    const folder = resource.items.find(item => item.id === target.id && item.path === target.path && !item.archivedAt);
    if (target.path !== "/" && !folder) { setError(ru ? "Папка изменилась. Выберите место назначения ещё раз." : "Folder changed. Select a destination again."); return; }
    pending.current = true; setSaving(true); setError("");
    try {
      const result = await resource.moveCases(ids, folder?.id ?? null);
      if (result.ok) { onMoved(); onClose(); } else setError(result.message);
    } catch { setError(ru ? "Не удалось переместить кейсы. Попробуйте ещё раз." : "Could not move test cases. Please try again."); }
    finally { pending.current = false; setSaving(false); }
  }
  return <section className={css.task} aria-label={ru ? "Переместить кейсы" : "Move test cases"} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel(); }
  }}>
    <header className={css.heading}>
      <button type="button" disabled={busy} onClick={cancel} aria-label={ru ? "Вернуться к тест-кейсам" : "Back to test cases"}><PiArrowLeft size={17} /></button>
      <h2 ref={heading} tabIndex={-1}>{ru ? "Переместить кейсы" : "Move test cases"}</h2>
    </header>
    <p className={css.caption}>{ru ? `Выбрано кейсов: ${ids.length}` : `${ids.length} ${ids.length === 1 ? "test case" : "test cases"} selected`}</p>
    <form onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy} className={css.destinations}><legend>{ru ? "Куда переместить" : "Choose a destination"}</legend>
        <ParentFolderPicker inline value={target.path} options={options} label={ru ? "Папка назначения" : "Destination folder"}
          searchLabel={ru ? "Найти папку" : "Find folder"} emptyLabel={ru ? "Папки не найдены" : "No matching folders"}
          onChange={path => { setTarget({ path, id: resource.items.find(item => item.path === path && !item.archivedAt)?.id ?? null }); setError(""); }} />
      </fieldset>
      {error && <p role="alert" className={css.error}>{error}</p>}
      <footer className={css.footer}>
        <span className={css.destination}><FolderBreadcrumb path={target.path} root={ru ? "Без папки" : "Unfiled"} /></span>
        <button type="submit" disabled={busy || !resource.canManage || !ids.length}>{busy ? (ru ? "Перемещение…" : "Moving…") : (ru ? "Переместить" : "Move")}<PiArrowRight size={15} /></button>
      </footer>
    </form>
  </section>;
}
