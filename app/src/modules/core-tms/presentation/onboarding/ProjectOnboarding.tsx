import { FolderKanban, ListChecks, PlayCircle, Plus } from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "../../tms.module.css";

export function ProjectOnboarding({
  loading,
  onCreate,
}: {
  loading: boolean;
  onCreate: () => void;
}) {
  const { t } = useTmsLocale();
  return (
    <section className={styles.onboarding} data-testid="project-onboarding">
      <div className={styles.onboardingPanel}>
        <span className={styles.onboardingEyebrow}>{t("workspace.title")}</span>
        <h1>
          {loading ? t("workspace.loading") : t("workspace.createFirstProject")}
        </h1>
        <p>
          {loading
            ? t("workspace.loadingLatest")
            : t("workspace.projectDescription")}
        </p>
        {!loading && (
          <button
            className={styles.primaryButton}
            onClick={onCreate}
            data-testid="create-first-project"
          >
            <Plus size={17} /> {t("header.createProject")}
          </button>
        )}
        <div className={styles.onboardingSteps}>
          <div>
            <span>01</span>
            <FolderKanban size={20} />
            <strong>{t("workspace.buildRepository")}</strong>
            <small>{t("workspace.buildRepositoryDescription")}</small>
          </div>
          <div>
            <span>02</span>
            <ListChecks size={20} />
            <strong>{t("workspace.defineCoverage")}</strong>
            <small>{t("workspace.defineCoverageDescription")}</small>
          </div>
          <div>
            <span>03</span>
            <PlayCircle size={20} />
            <strong>{t("workspace.runAndReport")}</strong>
            <small>{t("workspace.runAndReportDescription")}</small>
          </div>
        </div>
      </div>
    </section>
  );
}
