"use client";

import type { ReactNode } from "react";
import { TrialFeature } from "../../sign-in/composition/TrialFeature";
import { ManagedAccessBoundary } from "./ManagedAccessBoundary";
import { ManagedWorkspaceGate } from "../workspace/ManagedWorkspaceGate";

export function ManagedWorkspaceBoundary({ children }: { readonly children: ReactNode }) {
  return <ManagedAccessBoundary>{(session, logout) =>
    <ManagedWorkspaceGate session={session} logout={logout}>{children}<TrialFeature key={session.workspaceId} /></ManagedWorkspaceGate>
  }</ManagedAccessBoundary>;
}
