"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { PrivateAttachmentClient } from "../../application/private-attachment-client";

const AttachmentClientContext = createContext<PrivateAttachmentClient | null>(null);

export function AttachmentClientProvider({
  client,
  children,
}: {
  readonly client: PrivateAttachmentClient;
  readonly children: ReactNode;
}) {
  return (
    <AttachmentClientContext.Provider value={client}>
      {children}
    </AttachmentClientContext.Provider>
  );
}

export function useAttachmentClient(): PrivateAttachmentClient {
  const client = useContext(AttachmentClientContext);
  if (!client) throw new Error("Attachment client is outside its TMS provider.");
  return client;
}
