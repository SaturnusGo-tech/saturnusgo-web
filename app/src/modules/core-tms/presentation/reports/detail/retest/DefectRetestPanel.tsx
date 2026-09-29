import { ChevronUp, Link2, LoaderCircle } from "lucide-react";
import type { DefectRetest } from "../../../../runs/verification/state/defect/useDefectRetest";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { useDisclosureMotion } from "../../../common/disclosure/useDisclosureMotion";
import styles from "./defect-retest.module.css";

export function DefectRetestPanel({ retest }: { retest: DefectRetest }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const open = retest.enabled && retest.isOpen;
  const disclosure = useDisclosureMotion(open, true);
  if (!disclosure.present) return null;
  return <div id="defect-retest-form" aria-hidden={!open || undefined}
    ref={element => { disclosure.ref.current = element; if (element) element.inert = !open; }}>
    <section className={styles.panel} aria-labelledby="defect-retest-heading">
      <header><h2 id="defect-retest-heading">{ru ? "Повторная проверка" : "Retest"}</h2>
        <button type="button" className={styles.collapse} onClick={() => { retest.close(); document.getElementById("defect-retest-toggle")?.focus(); }} disabled={retest.pending}>
          {ru ? "Свернуть" : "Collapse"}<ChevronUp size={14} aria-hidden="true"/>
        </button>
      </header>
      <form className={styles.form} onSubmit={event => { event.preventDefault(); void retest.start(); }}>
        <div className={styles.fields}>
          <label><span>{ru ? "Окружение" : "Environment"}</span>
            <select value={retest.environmentId} disabled={retest.pending || retest.unresolved}
              onChange={event => retest.setEnvironmentId(event.target.value)}>
              {!retest.environmentId && <option value="">{ru ? "Выберите окружение" : "Select environment"}</option>}
              {retest.environments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label><span>{ru ? "Сборка с исправлением" : "Fixed build"}</span>
            <input value={retest.build} maxLength={500} disabled={retest.pending || retest.unresolved}
              placeholder={ru ? "Например, 2.4.1 (148)" : "For example, 2.4.1 (148)"}
              onChange={event => retest.setBuild(event.target.value)} />
          </label>
        </div>
        {!retest.environments.length && <p role="status">{ru ? "Добавьте окружение в настройках проекта." : "Add an environment in project settings."}</p>}
        <footer>
          <div className={styles.scope}>
            <span><Link2 size={14} aria-hidden="true"/>{ru ? "Связанные кейсы" : "Linked cases"}{retest.linkedCases !== null ? ` · ${retest.linkedCases}` : ""}</span>
            <p>{retest.countError ? (ru ? "Не удалось загрузить состав. Проверим повторно при создании." : "Could not load the scope. It will be checked again when creating the run.")
              : (ru ? "В прогон войдут только кейсы этого дефекта." : "Only cases linked to this bug report will be included.")}</p>
          </div>
          <button type="submit" className={`${styles.start} ${styles.submit}`} disabled={retest.pending || !retest.canStart}>
            {retest.pending && <LoaderCircle className={styles.spinner} size={15} aria-hidden="true"/>}
            {retest.pending ? (ru ? "Создаём…" : "Creating…") : retest.unresolved ? (ru ? "Повторить запуск" : "Retry start") : (ru ? "Создать прогон" : "Create run")}
          </button>
        </footer>
        {retest.error && <p className={styles.error} role="alert">{retest.error}</p>}
      </form>
    </section>
  </div>;
}
