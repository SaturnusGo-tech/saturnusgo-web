"use client";

import type { TdmConfiguration } from "../../model/configuration/configuration";
import { createContext, useContext, type ReactNode } from "react";
import type { TestDataPort } from "../ports/test-data-port";
import type { WorkspaceDataPort } from "../ports/workspace-data-port";
import type { DataEnvironment, TdmPermissions } from "../../model/resources/resource";
export type TestDataContextValue = { readonly port: TestDataPort; readonly workspace?: WorkspaceDataPort; readonly projectId: string; readonly actorId: string;
  readonly environments: readonly DataEnvironment[]; readonly permissions: TdmPermissions; readonly configuration: TdmConfiguration };
const Context = createContext<TestDataContextValue | null>(null);
export function TestDataProvider({ value, children }: { readonly value: TestDataContextValue | null; readonly children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useTestData() { return useContext(Context); }
