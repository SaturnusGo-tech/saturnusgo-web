import { Plus } from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "./project-onboarding.module.css";

export function ProjectOnboarding({ canCreate, onCreate }: {
  canCreate: boolean;
  onCreate: () => void;
}) {
  const { t } = useTmsLocale();
  return (
    <section className={styles.empty} data-testid="project-onboarding" aria-labelledby="project-onboarding-title">
      <div className={styles.content}>
        <img className={styles.artwork} src="/falcon/projects/empty-project-v1.webp"
          width={640} height={519} alt="" aria-hidden="true" draggable={false} />
        <h1 id="project-onboarding-title">{t("workspace.createFirstProject")}</h1>
        <p>{t(canCreate ? "workspace.projectDescription" : "workspace.askAdministratorForProject")}</p>
        {canCreate && <button type="button" className={styles.create} onClick={onCreate}
          data-testid="create-first-project">
          <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
          {t("workspace.addProject")}
        </button>}
      </div>
    </section>
  );
}
