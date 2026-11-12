"use client";
import { createContext, useContext, type ReactNode } from "react";

export const IntegrationControlContext = createContext(false);

export function IntegrationControlScope({ disabled, children }: { disabled: boolean; children: ReactNode }) {
  const inherited = useContext(IntegrationControlContext);
  return <IntegrationControlContext.Provider value={inherited || disabled}>{children}</IntegrationControlContext.Provider>;
}
