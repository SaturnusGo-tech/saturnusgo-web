"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const WorkspaceHeaderActionsHost = createContext<HTMLElement | null | undefined>(undefined);

export function WorkspaceHeaderActions({ children }: { children: ReactNode }) {
  const host = useContext(WorkspaceHeaderActionsHost);
  if (host === undefined) return children;
  return host ? createPortal(children, host) : null;
}
