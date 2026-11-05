"use client";
import type { ComponentProps } from "react";
import { visitWorkspace } from "../../../state/navigation/browser/workspace-history";
import { isWorkspaceBillingNavigation, workspaceBillingUrl } from "../../navigation/billing-route";

type Props = Omit<ComponentProps<"a">, "href"> & { workspaceId?: string };

export function BillingLink({ workspaceId, children, onClick, ...props }: Props) {
  const href = workspaceBillingUrl(typeof window === "undefined" ? "https://falcon.invalid/" : window.location.href, workspaceId);
  return <a {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || !isWorkspaceBillingNavigation(window.location.href)) return;
    event.preventDefault(); visitWorkspace(workspaceBillingUrl(window.location.href, workspaceId));
  }}>{children}</a>;
}
