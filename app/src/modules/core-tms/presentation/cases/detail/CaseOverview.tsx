import { Check, Tag } from "lucide-react";
import type { TestCaseRevision, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { executableSteps } from "../../../helpers/cases/caseRevision";
import { localizedComponentLabel, localizedLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import { LifecycleBadge, PriorityBadge } from "../list/CaseBadges";
import styles from "../cases.module.css";

export function CaseOverview({
  locale,
  testCase,
  revision,
}: {
  locale: TmsLocale;
  testCase: TestCaseSummary;
  revision: TestCaseRevision;
}) {
  const ru = locale === "ru";
  const steps = executableSteps(revision, locale);
  return (
    <div className={styles.overview}>
      <div className={styles.badgeLine}>
        <LifecycleBadge locale={locale} lifecycle={revision.lifecycle} archived={Boolean(testCase.archivedAt)} />
        <PriorityBadge locale={locale} priority={revision.priority} />
        <span className={styles.revisionLabel}>{ru ? "Ревизия" : "Revision"} {revision.revision}</span>
      </div>
      <p className={styles.detailDescription}>{revision.description || (ru ? "Описание не указано" : "No description")}</p>
      {revision.tags.length > 0 && <div className={styles.tags}>
        {revision.tags.map((tag) => <span key={tag}><Tag size={11} />{tag}</span>)}
      </div>}
      <dl className={styles.facts}>
        <div><dt>{ru ? "Состояние" : "Status"}</dt><dd>{localizedLabel(locale, testCase.archivedAt ? "archived" : revision.lifecycle)}</dd></div>
        <div><dt>{ru ? "Компонент" : "Component"}</dt><dd>{localizedComponentLabel(locale, revision.component) || "—"}</dd></div>
        <div><dt>{ru ? "Приоритет" : "Priority"}</dt><dd>{localizedLabel(locale, revision.priority)}</dd></div>
        <div><dt>{ru ? "Оценка" : "Estimate"}</dt><dd>{revision.estimatedMinutes === null ? "—" : `${revision.estimatedMinutes} ${ru ? "мин" : "min"}`}</dd></div>
        <div><dt>{ru ? "Ответственный" : "Owner"}</dt><dd>{revision.ownerIdentityId || "—"}</dd></div>
        <div><dt>{ru ? "Тип" : "Type"}</dt><dd>{localizedLabel(locale, revision.type)}</dd></div>
      </dl>
      <section className={styles.detailSection}>
        <h3>{ru ? "Предусловия" : "Preconditions"}</h3>
        <p>{revision.preconditions || (ru ? "Предусловия не указаны." : "No preconditions specified.")}</p>
      </section>
      {revision.testData && <section className={styles.detailSection}>
        <h3>{ru ? "Тестовые данные" : "Test data"}</h3>
        <p>{revision.testData}</p>
      </section>}
      <section className={styles.detailSection}>
        <div className={styles.detailSectionHeading}>
          <h3>{revision.type === "checklist" ? (ru ? "Чек-лист" : "Checklist") : (ru ? "Шаги теста" : "Test steps")}</h3>
          <span>{steps.length}</span>
        </div>
        <ol className={styles.stepsList}>
          {steps.map((step) => <li key={step.id}>
            <span>{step.order}</span>
            <div><strong>{step.action}</strong><p><Check size={12} />{step.expectedResult}</p></div>
          </li>)}
        </ol>
      </section>
    </div>
  );
}
