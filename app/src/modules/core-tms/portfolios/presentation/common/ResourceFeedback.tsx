import { PiArrowClockwise, PiSpinnerGap } from "react-icons/pi";
import { formatTmsMutationFailure, type TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { FormError } from "../../../presentation/common/error/FormError";
import type { PortfolioCopy } from "../../model/copy";
import styles from "../styles/portfolios.module.css";

export function ResourceFeedback({ loading, error, copy, retry }: { loading: boolean; error: TmsMutationFailure | null; copy: PortfolioCopy; retry: () => void }) {
  return <>
    {loading && <p className={styles.loading} role="status"><PiSpinnerGap className={styles.spin} aria-hidden="true" />{copy.loading}</p>}
    {error && <div className={styles.error}><FormError message={formatTmsMutationFailure(error, copy.loadError)} />
      <button className={styles.secondary} type="button" onClick={retry}><PiArrowClockwise aria-hidden="true" />{copy.retry}</button></div>}
  </>;
}
