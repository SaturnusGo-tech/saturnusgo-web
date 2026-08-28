"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PrivateAttachmentClient } from "../../application/private-attachment-client";

type AttachmentContext = {
  readonly client: PrivateAttachmentClient;
  readonly hiddenIds: ReadonlySet<string>;
  hide(attachmentId: string): void;
};
const AttachmentClientContext = createContext<AttachmentContext | null>(null);

export function AttachmentClientProvider({
  client,
  children,
}: {
  readonly client: PrivateAttachmentClient;
  readonly children: ReactNode;
}) {
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());
  const value = useMemo<AttachmentContext>(() => ({
    client,
    hiddenIds,
    hide: (attachmentId) => setHiddenIds((current) => new Set(current).add(attachmentId)),
  }), [client, hiddenIds]);
  return (
    <AttachmentClientContext.Provider value={value}>
      {children}
    </AttachmentClientContext.Provider>
  );
}

export function useAttachmentClient(): PrivateAttachmentClient {
  const context = useAttachmentContext();
  return context.client;
}

export function useAttachmentVisibility() {
  return useAttachmentContext();
}

function useAttachmentContext(): AttachmentContext {
  const context = useContext(AttachmentClientContext);
  if (!context) throw new Error("Attachment client is outside its TMS provider.");
  return context;
}
