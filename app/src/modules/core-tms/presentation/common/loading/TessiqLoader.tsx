import styles from "../../../tms.module.css";

export function TessiqLoader({
  label,
  pane = false,
  testId = "tessiq-loading",
}: {
  label: string;
  pane?: boolean;
  testId?: string;
}) {
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
      </div>
    </section>
  );
}
