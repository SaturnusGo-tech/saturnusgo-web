import { ArrowLeft, Layers, Play, RotateCcw, Settings2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Suite, SuiteSummary, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../folders/model/folder";
import { useSuitePreview } from "../../../suites/state/preview/useSuitePreview";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { MarkdownField } from "../../cases/inspector/markdown/MarkdownField";
import { RunCasesSkeleton } from "../../runs/loading/RunCasesSkeleton";
import { SuiteRepository } from "./repository/SuiteRepository";
import shared from "../suites.module.css";
import css from "./detail.module.css";

type Props = {
  suite: SuiteSummary | undefined; detail: Suite | null; cases: TestCaseSummary[]; folders: readonly RepositoryFolder[]; projectName: string;
  error: boolean; onRetry: () => void; onBack: () => void; canManage: boolean; canRun: boolean;
  onConfigure: (id: string) => void; onRun: (id: string) => void; onOpenCase: (testCase: TestCaseSummary) => void;
};
export function SuiteDetail(props: Props) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [props.suite?.id]);
  const { suite, detail } = props;
  const preview = useSuitePreview(props.cases, detail, props.folders); const cases = preview.cases;
  return <>
    <div className={css.topbar}><button type="button" className={shared.quiet} onClick={props.onBack}><ArrowLeft size={16} />{t("suite.title")}</button>
      {suite && <div className={css.actions}>
        {props.canManage && <button type="button" className={shared.quiet} disabled={!detail || suite.status === "archived"} onClick={() => props.onConfigure(suite.id)}><Settings2 size={16} />{ru ? "Настроить" : "Configure"}</button>}
        {props.canRun && <button type="button" className={shared.play} aria-label={ru ? "Запустить сьют" : "Run suite"} title={ru ? "Запустить прогон" : "Start run"} disabled={suite.status === "archived"} onClick={() => props.onRun(suite.id)}><Play size={17} fill="currentColor" /></button>}
      </div>}
    </div>
    {!suite ? <div className={shared.empty}><Layers size={26} /><h2>{ru ? "Сьют недоступен" : "Suite unavailable"}</h2><p>{ru ? "Возможно, набор был удалён или относится к другому проекту." : "This suite may have been removed or belongs to another project."}</p></div> : <>
      <header className={css.header}><h1 ref={heading} tabIndex={-1}>{suite.name}</h1>
        <div className={css.metadata}><span>{suite.type === "dynamic" ? (ru ? "По тегам" : "By tags") : (ru ? "Вручную" : "Manual")}</span>
          {suite.status === "archived" && <span>{ru ? "В архиве" : "Archived"}</span>}
          {suite.type === "dynamic" && detail?.filter.tags?.map(tag => <span key={tag}>#{tag}</span>)}
        </div>
        {suite.description.trim() && <div className={css.description}><MarkdownField label={ru ? "Описание" : "Description"} value={suite.description} allowAttachments={false} /></div>}
      </header>
      {(props.error && !detail) || preview.error ? <div className={shared.empty} data-testid="suite-detail-error" role="status"><h2>{ru ? "Не удалось загрузить состав" : "Could not load suite cases"}</h2><button type="button" className={shared.quiet} onClick={preview.error ? preview.retry : props.onRetry}><RotateCcw size={15} />{ru ? "Повторить" : "Retry"}</button></div>
        : !detail || preview.loading ? <div data-testid="suite-detail-loading"><RunCasesSkeleton /></div> : <>
          {cases.length < detail.resolvedCaseCount && <p className={css.rule}>{ru ? `Загружено ${cases.length} из ${detail.resolvedCaseCount}. При запуске используется полный состав сьюта.` : `${cases.length} of ${detail.resolvedCaseCount} cases loaded. Runs use the full resolved suite.`}</p>}
          <SuiteRepository key={detail.id} suiteId={detail.id} cases={cases} folders={props.folders} projectName={props.projectName} ru={ru} onOpen={props.onOpenCase} />
        </>}
    </>}
  </>;
}
