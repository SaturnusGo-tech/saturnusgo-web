import { LoaderCircle } from "lucide-react";
import type { ProductDocsCopy } from "../../localization/copy";
import styles from "../product-docs.module.css";

export function ReadState({ copy, status, retry }: {
  copy: ProductDocsCopy;
  status: "loading" | "error";
  retry(): void;
}) {
  if (status === "loading") return <div className={styles.readState} role="status">
    <LoaderCircle size={18} className={styles.loadingIcon} aria-hidden="true" />
    <span>{copy.loading}</span>
  </div>;

  return <div className={styles.readState} role="alert">
    <span>{copy.unavailable}</span>
    <button type="button" className={styles.action} onClick={retry}>{copy.retry}</button>
  </div>;
}
