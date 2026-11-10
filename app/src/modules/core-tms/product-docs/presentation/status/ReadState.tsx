import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import type { ProductDocsCopy } from "../../localization/copy";
import styles from "../product-docs.module.css";

export function ReadState({ copy, status, retry }: {
  copy: ProductDocsCopy;
  status: "loading" | "error";
  retry(): void;
}) {
  if (status === "loading") return <div className={styles.readState} role="status">
    <LoadingOrb size="md" />
    <span>{copy.loading}</span>
  </div>;

  return <ErrorToast message={copy.unavailable} retryLabel={copy.retry} onRetry={retry} />;
}
