"use client";
import { createContext, useContext, type ReactNode } from "react";
const Context = createContext({ workspaceId: "", offline: true });
export function WorkspacePeopleProvider({ workspaceId, offline, children }: { workspaceId: string; offline: boolean; children: ReactNode }) {
  return <Context.Provider value={{ workspaceId, offline }}>{children}</Context.Provider>;
}
export function useWorkspacePeople() { return useContext(Context); }
