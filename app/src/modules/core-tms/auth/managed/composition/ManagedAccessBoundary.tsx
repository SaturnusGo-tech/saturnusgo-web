"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { createManagedAccessClient } from "../data/managed-access-client";
import { useManagedAccess } from "../application/useManagedAccess";
import { ManagedAccessScreen } from "../presentation/screen/ManagedAccessScreen";
import type { SignedInCompanySession } from "../domain/managed-access";
import { TmsAuthState } from "../../presentation/state/TmsAuthState";

export function ManagedAccessBoundary({ children }: {
  readonly children: (session: SignedInCompanySession, logout: () => Promise<void>) => ReactNode;
}) {
  const client = useMemo(() => createManagedAccessClient(), []);
  const access = useManagedAccess(client);
  if (access.state.loading) return <TmsAuthState kind="loading" />;
  if (!access.state.session?.authenticated || access.state.recoveryCodes.length > 0) {
    return <ManagedAccessScreen access={access} />;
  }
  return children(access.state.session, access.logout);
}
