import { ChevronRight, ExternalLink, History, Paperclip } from "lucide-react";
import type { KeyboardEvent, Ref } from "react";
import type { Activity, TestCaseRevision, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { AttachmentLink } from "../../../attachments/presentation/link/AttachmentLink";
import { activityLabel } from "../../../localization/activity/label";
import type { TmsLocaleContextValue } from "../../../localization/context/TmsLocaleProvider";
import { localizedComponentLabel, localizedLabel } from "../../../localization/format/labels";
import styles from "../../../tms.module.css";

export type CaseInformationInspectorProps = Pick<
  TmsLocaleContextValue,
  "locale" | "languageTag" | "t"
> & {
  testCase: TestCaseSummary;
  revision: TestCaseRevision;
  activity: Activity[];
  linkIds: string[];
  onCollapse: () => void;
  modal?: boolean;
  collapseButtonRef?: Ref<HTMLButtonElement>;
  collapseLabel?: string;
};

function normalizedTags(tags: string[], locale: TmsLocaleContextValue["locale"]) {
  const seen = new Set<string>();
  return tags.map((tag) => tag.trim().replace(/^#+/, "")).filter((tag) => {
    const key = tag.toLocaleLowerCase(locale);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function CaseInformationInspector({
  testCase,
  revision,
  activity,
  linkIds,
  locale,
  languageTag,
  t,
  onCollapse,
  modal = false,
  collapseButtonRef,
  collapseLabel,
}: CaseInformationInspectorProps) {
  const tags = normalizedTags(revision.tags, locale);
  const evidenceCount = revision.attachmentIds.length + linkIds.length;
  const caseActivity = activity
    .filter(
      (entry) =>
        entry.action.startsWith("test_case.") &&
          entry.entityKey === testCase.key,
    )
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  const latestRevision = caseActivity.find((entry) =>
    entry.action.startsWith("test_case."),
  );
  const lifecycle = testCase.archivedAt ? "archived" : revision.lifecycle;
  const date = (value: string) =>
    new Date(value).toLocaleString(languageTag, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  const collapseText = collapseLabel ?? t("cases.collapse");
  const keepFocusInside = (event: KeyboardEvent<HTMLElement>) => {
    if (!modal || event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.offsetParent !== null);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return (
    <aside
      id="case-inspector"
      className={`${styles.pane} ${styles.contextPane} ${styles.caseInspector}`}
      aria-labelledby="case-inspector-title"
      aria-modal={modal || undefined}
      role={modal ? "dialog" : undefined}
      onKeyDown={keepFocusInside}
    >
      <h2 id="case-inspector-title" className={styles.srOnly}>{t("cases.details")}</h2>
      <button
        ref={collapseButtonRef}
        type="button"
        className={styles.caseInspectorCollapse}
        onClick={onCollapse}
        aria-label={collapseText}
        title={collapseText}
      >
        <ChevronRight size={17} />
      </button>

      <div className={styles.caseInspectorBody}>
        <dl className={styles.caseInspectorMeta}>
          <div>
            <dt>{t("common.status")}</dt>
            <dd className={styles.caseInspectorStatus}>
              <span
                className={`${styles.lifecycleDot} ${
                  testCase.archivedAt
                    ? styles.dotArchived
                    : styles[`dot_${revision.lifecycle}`]
                }`}
                aria-hidden="true"
              />
              {localizedLabel(locale, lifecycle)}
            </dd>
          </div>
          <div>
            <dt>{t("cases.priority")}</dt>
            <dd>{localizedLabel(locale, revision.priority)}</dd>
          </div>
          <div>
            <dt>{t("common.owner")}</dt>
            <dd>{revision.ownerIdentityId ?? t("common.unassigned")}</dd>
          </div>
          <div>
            <dt>{t("cases.component")}</dt>
            <dd>{revision.component ? localizedComponentLabel(locale, revision.component) : "\u2014"}</dd>
          </div>
          <div>
            <dt>{t("cases.estimate")}</dt>
            <dd>
              {revision.estimatedMinutes === null
                ? "\u2014"
                : `${revision.estimatedMinutes} ${locale === "ru" ? "\u043c\u0438\u043d" : "min"}`}
            </dd>
          </div>
          <div>
            <dt>{t("cases.type")}</dt>
            <dd>{localizedLabel(locale, revision.type)}</dd>
          </div>
          <div className={styles.caseInspectorTags}>
            <dt>{t("caseDialog.tags")}</dt>
            <dd>{tags.length > 0 ? tags.map((tag) => `#${tag}`).join(" \u00b7 ") : "\u2014"}</dd>
          </div>
        </dl>

        <section className={styles.caseInspectorGroup}>
          <h3>{t("cases.activity")}</h3>
          <div className={styles.caseInspectorActivity}>
            <div>
              <History size={15} aria-hidden="true" />
              <span>
                <strong>
                  {latestRevision
                    ? activityLabel(locale, latestRevision.action)
                    : t("cases.revision", { revision: revision.revision })}
                </strong>
                <small>{date(latestRevision?.createdAt ?? revision.createdAt)}</small>
              </span>
            </div>
          </div>
        </section>

        <section className={styles.caseInspectorGroup}>
          <div className={styles.caseInspectorGroupTitle}>
            <h3>{t("cases.evidenceAndLinks")}</h3>
            <span>{evidenceCount}</span>
          </div>
          {evidenceCount === 0 ? (
            <p className={styles.caseInspectorEmpty}>
              <Paperclip size={15} aria-hidden="true" />
              {t("cases.noFiles")}
            </p>
          ) : (
            <div className={styles.caseInspectorEvidence}>
              {revision.attachmentIds.map((id) => (
                <AttachmentLink key={id} attachmentId={id} />
              ))}
              {linkIds.map((id) => (
                <span key={id}>
                  <ExternalLink size={14} aria-hidden="true" />
                  {id}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
