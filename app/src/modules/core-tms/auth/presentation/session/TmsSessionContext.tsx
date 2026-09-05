"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export interface TmsSessionIdentity {
  readonly kind: "admin" | "cloud";
  readonly label: string;
  readonly signOut: () => Promise<void>;
}

const Context = createContext<TmsSessionIdentity | null>(null);

export function TmsSessionProvider({
  children,
  value,
}: {
  readonly children: ReactNode;
  readonly value: TmsSessionIdentity;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTmsSession(): TmsSessionIdentity {
  const value = useContext(Context);
  if (!value) throw new Error("TMS session control is outside its authentication provider.");
  return value;
}
