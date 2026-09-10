"use client";

import type { ManagedAvatarLoader } from "../../managed/domain/managed-avatar";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export interface TmsSessionIdentity {
  readonly kind: "admin" | "cloud" | "managed";
  readonly label: string;
  readonly subject: string | null;
  readonly profilePath?: string;
  readonly administrationPath?: string;
  readonly hasAvatar?: boolean;
  readonly companyCapabilities?: readonly string[];
  readonly avatarLoader?: ManagedAvatarLoader;
  readonly avatarVersion?: number;
  readonly updateProfile?: (profile: { name: string; hasAvatar: boolean; version: number }) => void;
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

export function useOptionalTmsSession(): TmsSessionIdentity | null { return useContext(Context); }
