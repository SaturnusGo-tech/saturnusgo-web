import styles from "../../../tms.module.css";

export function SaturnLoader({
  label,
  pane = false,
  testId = "saturn-loading",
}: {
  label: string;
  pane?: boolean;
  testId?: string;
}) {
  return (
    <section
      className={`${styles.saturnLoader} ${pane ? styles.saturnLoaderPane : ""}`}
      aria-busy="true"
      role="status"
      data-testid={testId}
    >
      <span className={styles.srOnly}>{label}</span>
      <div className={styles.workspaceLoaderOrbit} aria-hidden="true">
        <span className={styles.workspaceLoaderTrack}>
          <span className={styles.workspaceLoaderSatellite} />
        </span>
        <span className={`${styles.workspaceLoaderTrack} ${styles.workspaceLoaderTrackInner}`}>
          <span className={styles.workspaceLoaderSatellite} />
        </span>
        <span className={styles.workspaceLoaderEcho} />
        <span className={styles.workspaceLoaderPlanet} />
      </div>
    </section>
  );
}
