"use client";
import type { ComponentProps } from "react";
import { visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { isWorkspaceProfileNavigation, workspaceProfileUrl } from "../navigation/profile-route";

type Props = Omit<ComponentProps<"a">, "href"> & { section?: "security" };

export function ProfileLink({ section, children, onClick, ...props }: Props) {
  const href = typeof window === "undefined" ? "/testcases/umbrella-home/work/?view=profile" : workspaceProfileUrl(window.location.href, section);
  return <a {...props} href={href} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || !isWorkspaceProfileNavigation(window.location.href)) return;
    event.preventDefault();
    visitWorkspace(workspaceProfileUrl(window.location.href, section));
  }}>{children}</a>;
}
