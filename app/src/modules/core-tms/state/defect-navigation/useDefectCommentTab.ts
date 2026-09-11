import { useEffect } from "react";
/** A message deep link always reveals the discussion, including restored browser history. */
export function useDefectCommentTab(projectId: string | undefined, defectId: string | null, show: () => void) {
  useEffect(() => {
    const restore = () => {
      const params = new URL(window.location.href).searchParams;
      if (params.get("projectId") === projectId && params.get("defectId") === defectId
        && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(params.get("commentId") ?? "")) show();
    };
    restore(); window.addEventListener("popstate", restore); window.addEventListener("falcon:navigation", restore);
    return () => { window.removeEventListener("popstate", restore); window.removeEventListener("falcon:navigation", restore); };
  }, [projectId, defectId, show]);
}
