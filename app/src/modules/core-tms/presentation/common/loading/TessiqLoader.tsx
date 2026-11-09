import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { ContentSkeleton } from "../skeleton/ContentSkeleton";
import styles from "../../../tms.module.css";

export function TessiqLoader({
  label,
  pane = false,
  branded = false,
  testId = "tessiq-loading",
}: {
  label: string;
  pane?: boolean;
  branded?: boolean;
  testId?: string;
}) {
  if (pane && !branded) return <ContentSkeleton label={label} testId={testId} />;
  return (
    <section
      className={`${styles.tessiqLoader} ${pane ? styles.tessiqLoaderPane : ""}`}
      aria-busy="true"
      role="status"
      data-testid={testId}
    >
      <span className={styles.srOnly}>{label}</span>
      <div className={styles.workspaceLoaderBrand} aria-hidden="true">
        <span className={styles.workspaceLoaderMark} />
        <LoadingOrb size="brand" />
      </div>
    </section>
  );
}
