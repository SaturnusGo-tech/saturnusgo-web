"use client";

import type { ReactNode } from "react";
import { ManagedAccessBoundary } from "./ManagedAccessBoundary";
import { ManagedWorkspaceGate } from "../workspace/ManagedWorkspaceGate";

export function ManagedWorkspaceBoundary({ children }: { readonly children: ReactNode }) {
  return <ManagedAccessBoundary>{(session, logout) =>
    <ManagedWorkspaceGate session={session} logout={logout}>{children}</ManagedWorkspaceGate>
  }</ManagedAccessBoundary>;
}
