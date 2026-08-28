"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";

const TmsHttpClientContext = createContext<TmsHttpClient | null>(null);

export function TmsHttpClientProvider({
  children,
  client,
}: {
  readonly children: ReactNode;
  readonly client: TmsHttpClient;
}) {
  return (
    <TmsHttpClientContext.Provider value={client}>
      {children}
    </TmsHttpClientContext.Provider>
  );
}

export function useTmsHttpClient(): TmsHttpClient {
  const client = useContext(TmsHttpClientContext);
  if (!client) throw new Error("TMS HTTP client is outside its authentication provider.");
  return client;
}
