import { useEffect, useState } from "react";

/** A workspace preference, independent of queue refreshes and project navigation. */
export function useVerificationLauncher(workspaceId: string) {
  const key = `tms.verification.collapsed.v1:${workspaceId}`;
  const [preference, setPreference] = useState({ key: "", collapsed: false });
  useEffect(() => {
    let collapsed = false;
    try { collapsed = window.localStorage.getItem(key) === "true"; } catch { /* Storage can be unavailable in private browsers. */ }
    setPreference({ key, collapsed });
  }, [key]);
  function setCollapsed(collapsed: boolean) {
    setPreference({ key, collapsed });
    try { window.localStorage.setItem(key, String(collapsed)); } catch { /* Keep the control usable for this session. */ }
  }
  return { ready: preference.key === key, collapsed: preference.key === key && preference.collapsed, setCollapsed };
}
