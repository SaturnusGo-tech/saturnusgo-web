"use client";
import { useEffect } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { TmsAuthState } from "../../../presentation/state/TmsAuthState";
import { WORKSPACE_PATH } from "../../../../navigation/workspace-route";
export function WorkspaceHandoffReturn({ workspaceId }: { workspaceId: string }) {
  const { locale } = useTmsLocale();
  useEffect(() => {
    window.location.replace(`${WORKSPACE_PATH}?${new URLSearchParams({ workspaceId, lang: locale })}`);
  }, [workspaceId, locale]);
  return <TmsAuthState kind="loading" />;
}
