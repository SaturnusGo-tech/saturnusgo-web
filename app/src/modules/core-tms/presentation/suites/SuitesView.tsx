import { ListChecks, Play, Plus, Search, Settings2 } from "lucide-react";
import { useState } from "react";
import type { Suite, SuiteSummary, TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import { matchesSuite } from "../../helpers/suites/matchesSuite";
import { formatCount } from "../../localization/format/count";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { EmbeddedCaseList } from "../cases/embedded/EmbeddedCaseList";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import styles from "../../tms.module.css";
import view from "./suites.module.css";

type Props = {
  suites: SuiteSummary[];
  cases: TestCaseSummary[];
  selected: string;
  selectedDetail: Suite | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onConfigure: (id: string) => void;
  onRun: (id: string) => void;
  onOpenCase: (testCase: TestCaseSummary) => void;
};

export function SuitesView({ suites, cases, selected, selectedDetail, onSelect, onCreate, onConfigure, onRun, onOpenCase }: Props) {
  const { locale, t } = useTmsLocale();
  const ru = locale === "ru";
  const [query, setQuery] = useState("");
  const visibleSuites = suites.filter((suite) => `${suite.key} ${suite.name} ${suite.description}`.toLowerCase().includes(query.toLowerCase()));
  const selectedSuite = suites.find((item) => item.id === selected) ?? suites[0];
  const detail = selectedDetail?.id === selectedSuite?.id ? selectedDetail : null;
  const suiteCases = detail ? cases.filter((item) => matchesSuite(item, detail)) : [];
  const created = selectedSuite ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(selectedSuite.createdAt)) : "";
  const updated = selectedSuite ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(selectedSuite.updatedAt)) : "";

  return (
    <div className={view.workspace}>
      <aside className={view.rail} aria-label={t("suite.title")}>
        <div className={view.railHeader}>
          <div><h2>{t("suite.title")}</h2><p>{formatCount(locale, suites.length, ["suite", "suites"], ["сьют", "сьюта", "сьютов"])}</p></div>
          <button className={view.createButton} onClick={onCreate} data-testid="new-suite"><Plus size={14} /><span>{ru ? "Новый сьют" : "New suite"}</span></button>
        </div>
        <label className={view.search}><Search size={15} /><input aria-label={t("suite.searchAria")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("suite.searchPlaceholder")} /></label>
        <div className={view.list}>
          {visibleSuites.map((suite) => (
            <button className={view.suiteRow} data-selected={suite.id === selectedSuite?.id} key={suite.id} onClick={() => onSelect(suite.id)}>
              <span className={view.suiteIcon} data-type={suite.type}><ListChecks size={14} /></span>
              <span className={view.suiteCopy}><strong>{suite.name}</strong><small>{suite.key} · {suite.type === "dynamic" ? (ru ? "По тегам" : "By tags") : (ru ? "Фиксированный" : "Fixed")}</small></span>
              <span className={view.caseCount}>{suite.type === "dynamic" ? (ru ? "Авто" : "Auto") : detail?.id === suite.id ? detail.resolvedCaseCount : suite.caseCount}</span>
            </button>
          ))}
          {visibleSuites.length === 0 && <div className={view.emptyList}><span>{t("suite.notFound")}</span><button className={styles.textButton} onClick={onCreate}><Plus size={14} />{t("suite.new")}</button></div>}
        </div>
      </aside>

      <section className={view.content}>
        {!selectedSuite ? (
          <div className={view.blank}><ListChecks size={24} /><strong>{t("suite.empty")}</strong><span>{t("suite.emptyHint")}</span><button className={view.primaryButton} onClick={onCreate}><Plus size={15} /> {t("suite.create")}</button></div>
        ) : !detail ? <TessiqLoader pane label={t("common.loading")} testId="suite-detail-loading" /> : (
          <>
            <div className={view.cardToolbar}>
              <span>{ru ? "Карточка тест-сьюта" : "Test suite"}</span>
              <div><button className={view.secondaryButton} onClick={() => onConfigure(selectedSuite.id)}><Settings2 size={15} /> {t("common.configure")}</button><button className={view.primaryButton} onClick={() => onRun(selectedSuite.id)} data-testid="run-suite"><Play size={15} /> {t("suite.run")}</button></div>
            </div>
            <header className={view.detailHeader}>
              <div className={view.titleLine}><h1>{selectedSuite.name}</h1><span className={view.key}>{selectedSuite.key}</span></div>
              <div className={view.metaLine}>
                <span className={view.typeBadge} data-type={detail.type}><ListChecks size={12} />{detail.type === "dynamic" ? (ru ? "Динамический" : "Dynamic") : (ru ? "Статический" : "Static")}</span>
                <span>{ru ? "Создан" : "Created"} {created}</span>
                <span>{ru ? "Обновлён" : "Updated"} {updated}</span>
              </div>
            </header>

            <div className={view.overview}>
              <section className={view.description}>
                <h2>{ru ? "Описание" : "Description"}</h2>
                <p>{selectedSuite.description || (ru ? "Описание не добавлено." : "No description added.")}</p>
              </section>
              <aside className={view.properties}>
                <h2>{ru ? "Состав" : "Scope"}</h2>
                <dl><div><dt>{ru ? "Тип набора" : "Suite type"}</dt><dd>{detail.type === "dynamic" ? (ru ? "Обновляется по тегам" : "Updates by tags") : (ru ? "Фиксированный список" : "Fixed list")}</dd></div><div><dt>{ru ? "Тест-кейсы" : "Test cases"}</dt><dd>{formatCount(locale, detail.resolvedCaseCount, ["case", "cases"], ["кейс", "кейса", "кейсов"])}</dd></div>{detail.type === "dynamic" && <div><dt>{ru ? "Обязательные теги" : "Required tags"}</dt><dd>{(detail.filter.tags ?? []).join(", ") || "—"}</dd></div>}</dl>
              </aside>
            </div>

            <section className={view.caseSection}>
              <div className={view.sectionHeading}><div><h2>{ru ? "Тест-кейсы" : "Test cases"}</h2><span>{formatCount(locale, suiteCases.length, ["case", "cases"], ["кейс", "кейса", "кейсов"])}</span></div><p>{ru ? "Состав набора, который попадёт в следующий запуск." : "The suite scope that will be included in the next run."}</p></div>
              <EmbeddedCaseList cases={suiteCases} locale={locale} ariaLabel={ru ? "Тест-кейсы сьюта" : "Suite test cases"} emptyLabel={t("suite.notFound")} onOpen={onOpenCase} maxHeight="min(48vh, 540px)" />
            </section>
          </>
        )}
      </section>
    </div>
  );
}
