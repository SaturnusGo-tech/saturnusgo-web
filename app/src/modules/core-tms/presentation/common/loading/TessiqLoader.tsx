import { FalconBrandMark } from "../../../../../shared/components/brand/FalconBrandMark";
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
      <FalconBrandMark className={styles.workspaceLoaderBrand} intro />
    </section>
  );
}
