"use client";

import { useWorkspaceAuthMode } from "../../composition/session/useWorkspaceAuthMode";
import type { ReactNode } from "react";
import { LegacyTmsAuthBoundary } from "./LegacyTmsAuthBoundary";
import { ManagedWorkspaceBoundary } from "../../managed/composition/ManagedWorkspaceBoundary";
import { TmsAuthState } from "../state/TmsAuthState";

export function TmsAuthBoundary({ children }: { readonly children: ReactNode }) {
  const state=useWorkspaceAuthMode();
  if(state.mode==="checking")return <TmsAuthState kind="loading"/>;
  if(state.mode==="denied"||state.mode==="error")return <TmsAuthState kind="error" onAction={state.retry}/>;
  return state.mode==="managed" ? <ManagedWorkspaceBoundary>{children}</ManagedWorkspaceBoundary>
    : <LegacyTmsAuthBoundary verifiedSession={state.cloudSession}>{children}</LegacyTmsAuthBoundary>;
}
