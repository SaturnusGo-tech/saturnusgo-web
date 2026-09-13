import { Modal } from "../../../../presentation/common/modal/Modal";
import { FormError } from "../../../../presentation/common/error/FormError";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { formatTmsMutationFailure } from "../../../../../../core/tms/errors/mutation-failure";
import type { useCatalogActions } from "../../state/useCatalogActions";
import css from "../../../presentation/styles/dialog.module.css";

export function CatalogActionDialog({ state }: { state: ReturnType<typeof useCatalogActions> }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const target = state.target; if (!target) return null;
  const labels = ru ? { archive: "Архивировать", restore: "Восстановить", remove: "Удалить портфель", detach: "Убрать из портфеля" }
    : { archive: "Archive", restore: "Restore", remove: "Delete portfolio", detach: "Remove from portfolio" };
  const hint = target.action === "detach" ? (ru ? "Проект появится в разделе «Без портфеля». Кейсы, прогоны и история сохранятся." : "The project will appear under Without portfolio. Cases, runs and history are preserved.")
    : target.action === "remove" ? (ru ? "Пустой портфель будет удалён из каталога. Вернуть его через архив будет нельзя." : "The empty portfolio will be removed from the catalog. It cannot be restored from the archive.")
    : target.kind === "portfolio" && target.action === "archive" ? (ru ? `Портфель и его проекты (${target.item.projectCount}) переместятся в архив. Кейсы, прогоны и история сохранятся.` : `The portfolio and its projects (${target.item.projectCount}) will move to the archive. Cases, runs and history are preserved.`)
    : target.kind === "portfolio" ? (ru ? "Вернутся портфель и проекты, архивированные вместе с ним. Ранее архивированные проекты останутся в архиве." : "The portfolio and projects archived with it will return. Previously archived projects remain archived.")
    : (ru ? "Изменится статус проекта. Его кейсы, прогоны и история сохранятся." : "The project status will change. Its cases, runs and history are preserved.");
  return <Modal title={`${labels[target.action]}?`} subtitle={target.item.name} panelClassName={css.panel} onClose={state.close}>
    <div className={css.body}><p className={css.note}>{hint}</p>{state.error && <FormError message={state.error.code === "PORTFOLIO_NOT_EMPTY"
      ? (ru ? "В портфеле есть проекты, в том числе архивные. Сначала уберите их из портфеля." : "The portfolio contains projects, including archived ones. Remove them first.")
      : formatTmsMutationFailure(state.error, ru ? "Не удалось сохранить. Обновите список и повторите." : "Could not save. Refresh the list and retry.")} />}</div>
    <footer className={css.footer}><button type="button" disabled={state.pending} onClick={state.close}>{ru ? "Отмена" : "Cancel"}</button>
      <button type="button" className={css.primary} disabled={state.pending} onClick={() => void state.confirm()}>{state.pending ? (ru ? "Сохранение…" : "Saving…") : labels[target.action]}</button></footer>
  </Modal>;
}
