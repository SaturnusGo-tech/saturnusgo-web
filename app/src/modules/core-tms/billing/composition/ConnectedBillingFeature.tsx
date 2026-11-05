"use client";
import { useMemo } from "react";
import { useOptionalTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useBilling } from "../application/useBilling";
import { createBillingApi } from "../data/http/billing-api";
import { createPreviewBillingPort } from "../data/preview/preview-billing";
import { BillingScreen } from "../presentation/screen/BillingScreen";

export function ConnectedBillingFeature({ workspaceId, preview = false, onClose }: { workspaceId: string; preview?: boolean; onClose?(): void }) {
  const http = useOptionalTmsHttpClient();
  const session = useOptionalTmsSession();
  const { locale } = useTmsLocale();
  const isolatedPreview = process.env.NODE_ENV !== "production" && preview && session?.subject === "preview:mercury";
  const workspaceKind = session?.workspaceKind ?? "company";
  const port = useMemo(() => isolatedPreview ? createPreviewBillingPort(workspaceKind, workspaceId) : http ? createBillingApi(http) : null,
    [http, isolatedPreview, workspaceId, workspaceKind]);
  const billing = useBilling({ port, workspaceId: session ? workspaceId : null, workspaceKind,
    canManage: isolatedPreview || session?.workspaceRole === "workspace_admin" });
  return <BillingScreen key={workspaceId} {...billing} ru={locale === "ru"} onClose={onClose} />;
}
