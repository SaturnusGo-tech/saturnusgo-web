"use client";

import dynamic from "next/dynamic";
import { TmsAuthBoundary } from "../../../auth/presentation/boundary/TmsAuthBoundary";
import { TmsAuthState } from "../../../auth/presentation/state/TmsAuthState";
import { TmsLocaleProvider } from "../../../localization/context/TmsLocaleProvider";
import { WorkspaceStartup } from "../../common/loading/WorkspaceStartup";

// Authenticated views import async editor and UI modules. Load them after the
// session check so the static export can render the workspace entry directly.
const LocalizedWorkspace = dynamic(() => import("../LocalizedWorkspace").then(module => module.LocalizedWorkspace), {
  ssr: false,
  loading: () => <TmsAuthState kind="loading" />,
});

export default function TmsWorkspace() {
  return (
    <TmsLocaleProvider>
      <WorkspaceStartup>
        <TmsAuthBoundary>
          <LocalizedWorkspace />
        </TmsAuthBoundary>
      </WorkspaceStartup>
    </TmsLocaleProvider>
  );
}
