import { ErrorToast } from "../../common/error/ErrorToast";
import { ArrowLeft, Play, Settings, Stack } from "@openai/apps-sdk-ui/components/Icon";
import { Button } from "@heroui/react";
import { useEffect, useRef } from "react";
import type { Suite, SuiteSummary, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../folders/model/folder";
import { useSuitePreview } from "../../../suites/state/preview/useSuitePreview";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { FalconTooltip } from "../../common/tooltip/FalconTooltip";
import { MarkdownField } from "../../cases/inspector/markdown/MarkdownField";
import { RunCasesSkeleton } from "../../runs/loading/RunCasesSkeleton";
import { SuiteRepository } from "./repository/SuiteRepository";
import { SuiteCriteria } from "./SuiteCriteria";
import { SuiteKindBadge } from "../shared/kind/SuiteKindBadge";
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
  const updated = suite ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(suite.updatedAt)) : "";
  const configureLabel = ru ? "Настроить сьют" : "Configure suite";
  const runLabel = ru ? "Запустить сьют" : "Run suite";
  return <div className={css.page}>
    <div className={css.topbar}><button type="button" className={shared.quiet} onClick={props.onBack}><ArrowLeft width={18} height={18} />{t("suite.title")}</button></div>
    {!suite ? <div className={shared.empty}><Stack width={30} height={30} /><h2>{ru ? "Сьют недоступен" : "Suite unavailable"}</h2><p>{ru ? "Возможно, набор был удалён или относится к другому проекту." : "This suite may have been removed or belongs to another project."}</p></div> : <>
      <header className={css.header}>
        <div className={css.heading}><h1 ref={heading} tabIndex={-1}>{suite.name}</h1>
          <div className={css.metadata}><span>{suite.key}</span><SuiteKindBadge type={suite.type} archived={suite.status === "archived"} ru={ru} />
            <time dateTime={suite.updatedAt}>{ru ? "Обновлён" : "Updated"} {updated}</time>
          </div>
        </div>
        <div className={css.actions}>
          {props.canManage && <FalconTooltip label={configureLabel}>
            <Button type="button" size="sm" radius="full" isIconOnly variant="light" disableRipple className={css.action}
              aria-label={configureLabel} isDisabled={!detail || suite.status === "archived"} onPress={() => props.onConfigure(suite.id)}>
              <Settings width={18} height={18} aria-hidden="true" />
            </Button>
          </FalconTooltip>}
          {props.canRun && <FalconTooltip label={runLabel}>
            <Button type="button" size="sm" radius="full" isIconOnly disableRipple className={`${css.action} ${css.runAction}`}
              aria-label={runLabel} isDisabled={suite.status === "archived" || !detail || detail.resolvedCaseCount === 0} onPress={() => props.onRun(suite.id)}>
              <Play width={18} height={18} aria-hidden="true" />
            </Button>
          </FalconTooltip>}
        </div>
      </header>
      {suite.description.trim() && <div className={css.description}><MarkdownField label={ru ? "Описание" : "Description"} value={suite.description} appearance="plain" allowAttachments={false} /></div>}
      {suite.status === "archived" && <p className={css.rule}>{ru ? "Этот сьют в архиве. Его можно просматривать, но нельзя изменять и запускать." : "This suite is archived. You can review it, but editing and runs are unavailable."}</p>}
      {(props.error && !detail) || preview.error ? <div className={css.rule} data-testid="suite-detail-error">
          <ErrorToast message={ru ? "Не удалось загрузить состав сьюта" : "Could not load suite cases"}
            retryLabel={ru ? "Повторить" : "Retry"} onRetry={preview.error ? preview.retry : props.onRetry} />
          <button type="button" className={shared.quiet} onClick={preview.error ? preview.retry : props.onRetry}>{ru ? "Повторить" : "Retry"}</button>
        </div>
        : !detail || preview.loading ? <div data-testid="suite-detail-loading" role="status"><p className={css.rule}>{ru ? "Загружаем состав сьюта…" : "Loading suite membership…"}</p><RunCasesSkeleton /></div> : <>
          <SuiteCriteria suite={detail} folders={props.folders} ru={ru} />
          {cases.length < detail.resolvedCaseCount && <p className={css.rule} role="status">{ru ? `Загружено ${cases.length} из ${detail.resolvedCaseCount}. При запуске используется полный состав сьюта.` : `${cases.length} of ${detail.resolvedCaseCount} cases loaded. Runs use the full resolved suite.`}</p>}
          <SuiteRepository key={detail.id} suiteId={detail.id} cases={cases} folders={props.folders} projectName={props.projectName} ru={ru} onOpen={props.onOpenCase} />
        </>}
    </>}
  </div>;
}
