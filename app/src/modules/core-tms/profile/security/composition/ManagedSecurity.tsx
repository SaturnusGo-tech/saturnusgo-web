import { useCallback, useMemo } from "react";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { GoogleLinkFeature } from "../../../auth/google-link/composition/GoogleLinkFeature";
import { createAdministrationClient } from "../../../company-administration/data/administration-client";
import { useAdministrationResource } from "../../../company-administration/application/state/useAdministrationResource";
import { ResourceState } from "../../../company-administration/presentation/common/ResourceState";
import { SecurityPanel } from "../presentation/SecurityPanel";

export function ManagedSecurity() {
  const http = useTmsHttpClient(), session = useTmsSession();
  const client = useMemo(() => createAdministrationClient(http), [http]);
  const resource = useAdministrationResource(useCallback((signal: AbortSignal) => client.profile(signal), [client]));
  if (!resource.value) return <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} />;
  return <SecurityPanel profile={resource.value} client={client} google={<GoogleLinkFeature company={!!session.workspaceId}/>}/>;
}
