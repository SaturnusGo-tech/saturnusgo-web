import { ArrowLeft, Layers, Pencil, Play, RotateCcw, Search, Tag, UserRound, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Suite, SuiteSummary, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useNavigationValue } from "../../../state/navigation/context/useNavigationValue";
import { matchesSuite } from "../../../helpers/suites/matchesSuite";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { formatCount } from "../../../localization/format/count";
import { EmbeddedCaseList } from "../../cases/embedded/EmbeddedCaseList";
import { TessiqLoader } from "../../common/loading/TessiqLoader";
import shared from "../suites.module.css";
import styles from "./detail.module.css";

type Props = {
  suite: SuiteSummary | undefined; detail: Suite | null; cases: TestCaseSummary[]; projectName: string;
  error: boolean; onRetry: () => void; onBack: () => void; canManage: boolean; canRun: boolean;
  onConfigure: (id: string) => void; onRun: (id: string) => void; onOpenCase: (testCase: TestCaseSummary) => void;
};
export function SuiteDetail(props: Props) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const [query, setQuery] = useNavigationValue(`suite:${props.suite?.id}:query`, ""); const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [props.suite?.id]);
  const { suite, detail } = props;
  const cases = detail ? props.cases.filter(item => !item.archivedAt && item.projectId === detail.projectId && matchesSuite(item, detail)) : [];
  const terms = query.trim().toLocaleLowerCase(locale).split(/\s+/).filter(Boolean);
  const visible = cases.filter(item => terms.every(term => `${item.title} ${item.key} ${item.component}`.toLocaleLowerCase(locale).includes(term)));
  return <>
    <button type="button" className={`${shared.quiet} ${styles.back}`} onClick={props.onBack}><ArrowLeft size={16} />{t("suite.title")}</button>
    {!suite ? <div className={shared.empty}><Layers size={26} /><h2>{ru ? "Сьют недоступен" : "Suite unavailable"}</h2><p>{ru ? "Возможно, набор был удалён или относится к другому проекту." : "This suite may have been removed or belongs to another project."}</p></div> : <>
      <header className={`${shared.header} ${styles.header}`}>
        <div><div className={shared.context}>{props.projectName}</div><h1 ref={heading} tabIndex={-1}>{suite.name}</h1>{suite.description.trim() && <p>{suite.description.trim()}</p>}</div>
        <div className={styles.actions}>
          {props.canManage && <button type="button" className={shared.quiet} disabled={!detail} onClick={() => props.onConfigure(suite.id)}><Pencil size={15} />{ru ? "Настроить" : "Configure"}</button>}
          {props.canRun && <button type="button" className={shared.primary} disabled={suite.status === "archived"} onClick={() => props.onRun(suite.id)}><Play size={15} />{ru ? "Запустить" : "Run suite"}</button>}
        </div>
      </header>
      <div className={styles.metadata}>
        <span>{suite.type === "dynamic" ? <Tag size={15} /> : <UserRound size={15} />}{suite.type === "dynamic" ? (ru ? "По тегам" : "By tags") : (ru ? "Вручную" : "Manual")}</span>
        {detail && <span>{formatCount(locale, detail.resolvedCaseCount, ["case", "cases"], ["кейс", "кейса", "кейсов"])}</span>}
        <span>{ru ? "Обновлён" : "Updated"} {new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(suite.updatedAt))}</span>
        {suite.status === "archived" && <span>{ru ? "В архиве" : "Archived"}</span>}
      </div>
      {props.error && !detail ? <div className={shared.empty} data-testid="suite-detail-error" role="status"><h2>{ru ? "Не удалось загрузить состав" : "Could not load suite cases"}</h2><p>{ru ? "Набор сохранён. Повторите загрузку, чтобы увидеть его кейсы." : "Your suite is saved. Try loading its cases again."}</p><button type="button" className={shared.quiet} onClick={props.onRetry}><RotateCcw size={15} />{ru ? "Повторить" : "Retry"}</button></div>
        : !detail ? <TessiqLoader pane label={ru ? "Загрузка состава" : "Loading suite cases"} testId="suite-detail-loading" /> : <>
          {detail.type === "dynamic" && <p className={styles.rule}>{ru ? "Кейсы со всеми тегами:" : "Cases matching all tags:"} <strong>{detail.filter.tags?.join(", ") || (ru ? "любые теги" : "any tags")}</strong></p>}
          <div className={styles.caseToolbar}><h2>{ru ? "Тест-кейсы" : "Test cases"} <span>{cases.length}</span></h2>
            <label className={shared.search} data-input-shell><Search size={15} /><input aria-label={ru ? "Найти кейс в сьюте" : "Find a case in this suite"} placeholder={ru ? "Найти кейс" : "Find a case"} value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label={ru ? "Очистить поиск" : "Clear search"} onClick={() => setQuery("")}><X size={14} /></button>}</label>
          </div>
          {cases.length < detail.resolvedCaseCount && <p className={styles.rule}>{ru ? `Загружено ${cases.length} из ${detail.resolvedCaseCount}. При запуске используется полный состав сьюта.` : `${cases.length} of ${detail.resolvedCaseCount} cases loaded. Runs use the full resolved suite.`}</p>}
          <EmbeddedCaseList cases={visible} locale={locale} ariaLabel={ru ? "Состав сьюта" : "Suite cases"} emptyLabel={query ? (ru ? "По этому запросу кейсов нет" : "No matching cases") : (ru ? "В этом наборе пока нет кейсов" : "This suite has no cases yet")} onOpen={props.onOpenCase} maxHeight="none" />
        </>}
    </>}
  </>;
}
