import { formatTmsMutationFailure } from "../../../../../../core/tms/errors/mutation-failure";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { FormError } from "../../../../presentation/common/error/FormError";
import type { useOrganizationManagement } from "../../state/useOrganizationManagement";
import { organizationCopy } from "../../model/copy";
import css from "../../../presentation/styles/portfolios.module.css";
export function ManagementFeedback({ state }: { state: ReturnType<typeof useOrganizationManagement> }) {
  const { locale } = useTmsLocale(); const copy = organizationCopy(locale);
  return <>{state.pending && <p className={css.loading} role="status">{copy.saving}</p>}
    {state.error && <div className={css.error}><FormError message={formatTmsMutationFailure(state.error, copy.saveError)} />
      <button type="button" className={css.textButton} onClick={state.reload}>{copy.reload}</button></div>}</>;
}
