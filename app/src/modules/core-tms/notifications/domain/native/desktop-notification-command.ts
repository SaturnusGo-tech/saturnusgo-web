/** A fixed command for the native shell; it conveys no authentication or arbitrary URL. */
export function desktopNotificationCommand(workspaceId: string, action: "notifications" | "notification-permission",
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent): string | null {
  const match = /(?:^|\s)FalconDesktop\/(\d+)\.(\d+)\.(\d+)(?:\s|$)/.exec(userAgent);
  if (!match || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(workspaceId)) return null;
  const [major, minor, patch] = match.slice(1).map(Number);
  if (major === 0 && (minor < 2 || (minor === 2 && patch < 12))) return null;
  return `falcon://preferences/${action}?${new URLSearchParams({ workspaceId })}`;
}
