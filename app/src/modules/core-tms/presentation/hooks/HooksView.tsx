import { Link2, Plus } from "lucide-react";
import { EmptyState } from "../common/empty/EmptyState";
import styles from "../../tms.module.css";
export function HooksView() {
  return <div className={`${styles.pane} ${styles.centeredPane}`}><EmptyState icon={<Link2 size={36} />} title="Hooks are prepared" text="The extension point is visible now; CI, webhooks, and automation hooks will be connected in a later iteration." action={<button className={styles.secondaryButton} disabled><Plus size={16} /> Add hook · coming later</button>} /></div>;
}
