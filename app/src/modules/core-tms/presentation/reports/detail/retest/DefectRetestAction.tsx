import { useRef } from "react";
import base from "../../../../tms.module.css";
import { createPortal } from "react-dom";
import { LoaderCircle, Play } from "lucide-react";
import type { DefectRetest } from "../../../../runs/verification/state/defect/useDefectRetest";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { Modal } from "../../../common/modal/Modal";
import styles from "./defect-retest.module.css";

export function DefectRetestAction({ retest, defectKey }: { retest: DefectRetest; defectKey: string }) {
  const anchor = useRef<HTMLButtonElement>(null);
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  if (!retest.enabled) return null;
  const label = ru ? "Повторная проверка" : "Retest";
  return <>
    <button ref={anchor} type="button" className={styles.start} onClick={retest.open}
      disabled={!retest.canStart || retest.pending} aria-label={label}
      title={!retest.canStart ? (ru ? "Недостаточно прав для запуска проверки" : "You cannot start a retest") : label}>
      <Play size={15} fill="currentColor" aria-hidden="true" /><span>{label}</span>
    </button>
    {retest.isOpen && createPortal(<Modal title={label} subtitle={defectKey} onClose={retest.close} panelClassName={styles.dialog}>
      <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void retest.start(); }}>
        <p>{ru ? "Проверьте исправление на нужной сборке. В прогон попадут только связанные с дефектом кейсы."
          : "Verify the fix on your build. The run includes only cases linked to this bug report."}</p>
        <label><span>{ru ? "Окружение" : "Environment"}</span>
          <select value={retest.environmentId} disabled={retest.pending || retest.unresolved}
            onChange={(event) => retest.setEnvironmentId(event.target.value)}>
            {!retest.environmentId && <option value="">{ru ? "Выберите окружение" : "Select environment"}</option>}
            {retest.environments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        {!retest.environments.length && <p role="status">{ru ? "Добавьте окружение в настройках проекта." : "Add an environment in project settings."}</p>}
        <label><span>{ru ? "Сборка с исправлением" : "Fixed build"}</span>
          <input value={retest.build} data-autofocus maxLength={500} disabled={retest.pending || retest.unresolved}
            placeholder={ru ? "Например, 2.4.1 (148)" : "For example, 2.4.1 (148)"}
            onChange={(event) => retest.setBuild(event.target.value)} />
        </label>
        {retest.error && <p className={styles.error} role="alert">{retest.error}</p>}
        <footer>
          <button type="button" className={styles.cancel} onClick={retest.close} disabled={retest.pending}>{ru ? "Отмена" : "Cancel"}</button>
          <button type="submit" className={styles.start} disabled={retest.pending || !retest.canStart}>
            {retest.pending ? <LoaderCircle className={styles.spinner} size={16} /> : <Play size={15} fill="currentColor" />}
            {retest.pending ? (ru ? "Запускаем…" : "Starting…") : retest.unresolved ? (ru ? "Повторить запуск" : "Retry start") : (ru ? "Начать проверку" : "Start retest")}
          </button>
        </footer>
      </form>
    </Modal>, anchor.current?.closest(`.${base.app}`) ?? document.body)}
  </>;
}
