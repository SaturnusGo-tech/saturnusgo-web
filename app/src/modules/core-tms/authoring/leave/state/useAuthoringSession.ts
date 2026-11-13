import { useCallback, useLayoutEffect, useRef } from "react";
import { authoringLeave } from "../application/authoring-leave";
import type { AuthoringSession } from "../application/leave-coordinator";

export function useAuthoringSession(session: AuthoringSession & { id: string }) {
  const current = useRef(session); current.current = session;
  const cleanup = useRef<(() => void) | undefined>(undefined);
  useLayoutEffect(() => {
    cleanup.current = authoringLeave.register(session.id, () => current.current);
    return () => { cleanup.current?.(); cleanup.current = undefined; };
  }, [session.id]);
  const release = useCallback(() => { cleanup.current?.(); cleanup.current = undefined; }, []);
  return { release };
}
