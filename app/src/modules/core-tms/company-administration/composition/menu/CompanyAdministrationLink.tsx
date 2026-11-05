"use client";
import type { ComponentProps } from "react";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useWorkspaceCapabilities } from "../../../auth/spaces/capabilities/composition/useWorkspaceCapabilities";
import { personalAdministrationUrl } from "../../navigation/personal-administration-route";
type Props = Omit<ComponentProps<"a">, "href"> & { workspaceId?: string; enabled?: boolean };
export function CompanyAdministrationLink({ workspaceId: requestedWorkspace, enabled = true, ...props }: Props) {
  const session = useOptionalTmsSession();
  const workspaceId = requestedWorkspace ?? session?.workspaceId;
  const scoped = !!session && !!workspaceId && (!session.workspaceId || workspaceId === session.workspaceId);
  const metadata = useWorkspaceCapabilities(workspaceId, enabled && scoped);
  const href = metadata.value?.teamAdministrationAvailable ? session?.administrationPath ?? personalAdministrationUrl(window.location.href, workspaceId!) : null;
  return href ? <a {...props} href={href} /> : null;
}
export const ConnectedCompanyAdministrationLink = CompanyAdministrationLink;
