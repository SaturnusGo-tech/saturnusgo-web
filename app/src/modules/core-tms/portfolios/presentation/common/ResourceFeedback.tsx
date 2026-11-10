import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { CatalogSkeleton } from "../loading/CatalogSkeleton";
import shell from "../../../tms.module.css";
import { ContentSkeleton } from "../../../presentation/common/skeleton/ContentSkeleton";
import { PiArrowClockwise } from "react-icons/pi";
import { formatTmsMutationFailure, type TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { FormError } from "../../../presentation/common/error/FormError";
import type { PortfolioCopy } from "../../model/copy";
import styles from "../styles/portfolios.module.css";

export function ResourceFeedback({ loading, error, copy, retry, hasContent = false, catalog = false }: { catalog?: boolean; loading: boolean; hasContent?: boolean; error: TmsMutationFailure | null; copy: PortfolioCopy; retry: () => void }) {
  return <>
    {loading && (hasContent ? <span className={shell.srOnly} role="status">{copy.loading}</span> : catalog ? <CatalogSkeleton copy={copy} /> : <ContentSkeleton compact variant="list" label={copy.loading} />)}
    <ErrorToast message={error ? formatTmsMutationFailure(error, copy.loadError) : null} retryLabel={copy.retry} onRetry={retry} />
  </>;
}
