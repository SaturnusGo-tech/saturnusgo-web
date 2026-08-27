import { FolderKanban, ListChecks, PlayCircle, Plus } from "lucide-react";
import styles from "../../tms.module.css";

export function ProjectOnboarding({
  loading,
  onCreate,
}: {
  loading: boolean;
  onCreate: () => void;
}) {
  return (
    <section className={styles.onboarding} data-testid="project-onboarding">
      <div className={styles.onboardingPanel}>
        <span className={styles.onboardingEyebrow}>TMS workspace</span>
        <h1>{loading ? "Loading workspace…" : "Create your first project"}</h1>
        <p>
          {loading
            ? "Loading the latest workspace state."
            : "Projects keep test cases, environments, suites, runs, and defects isolated. Start with a real project—no sample records will be added."}
        </p>
        {!loading && (
          <button
            className={styles.primaryButton}
            onClick={onCreate}
            data-testid="create-first-project"
          >
            <Plus size={17} /> Create project
          </button>
        )}
        <div className={styles.onboardingSteps}>
          <div>
            <span>01</span>
            <FolderKanban size={20} />
            <strong>Build the repository</strong>
            <small>Create folders, manual cases, and checklists.</small>
          </div>
          <div>
            <span>02</span>
            <ListChecks size={20} />
            <strong>Define coverage</strong>
            <small>Group exact cases into smoke or regression suites.</small>
          </div>
          <div>
            <span>03</span>
            <PlayCircle size={20} />
            <strong>Run and report</strong>
            <small>Execute every step and capture defects with evidence.</small>
          </div>
        </div>
      </div>
    </section>
  );
}
