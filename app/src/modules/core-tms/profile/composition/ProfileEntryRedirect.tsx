"use client";
import { useEffect } from "react";
import { TmsAuthState } from "../../auth/presentation/state/TmsAuthState";
import { workspaceProfileUrl } from "../navigation/profile-route";

export function ProfileEntryRedirect() {
  useEffect(() => { window.location.replace(workspaceProfileUrl(window.location.href)); }, []);
  return <TmsAuthState kind="loading" />;
}
