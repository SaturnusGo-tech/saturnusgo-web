"use client";
import { useMemo, type ComponentProps } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useBillingSummary } from "../../../billing/application/useBillingSummary";
import { createBillingApi } from "../../../billing/data/http/billing-api";
import { personalAdministrationUrl } from "../../navigation/personal-administration-route";
import { billingPaymentsAvailable } from "../../../billing/domain/catalog/billing-availability";

type Props = Omit<ComponentProps<"a">, "href"> & { workspaceId?: string; enabled?: boolean };
export function CompanyAdministrationLink({ workspaceId: requestedWorkspace, enabled = true, ...props }: Props) {
  const session = useOptionalTmsSession();
  if (session?.administrationPath) return <a {...props} href={session.administrationPath} />;
  return billingPaymentsAvailable ? <ConnectedCompanyAdministrationLink {...props} workspaceId={requestedWorkspace} enabled={enabled} /> : null;
}
export function ConnectedCompanyAdministrationLink({ workspaceId: requestedWorkspace, enabled = true, ...props }: Props) {
  const session = useOptionalTmsSession(), http = useOptionalTmsHttpClient();
  const workspaceId = requestedWorkspace ?? session?.workspaceId ?? null;
  const personal = session?.kind === "cloud" && workspaceId === session.workspaceId;
  const port = useMemo(() => http ? createBillingApi(http) : null, [http]);
  const model = useBillingSummary({ port, workspaceId, enabled: enabled && personal && !session?.administrationPath });
  const href = session?.administrationPath ?? (personal && workspaceId && model.summary?.canManage && model.summary.teamAdministration
    ? personalAdministrationUrl(window.location.href, workspaceId) : null);
  return href ? <a {...props} href={href} /> : null;
}
