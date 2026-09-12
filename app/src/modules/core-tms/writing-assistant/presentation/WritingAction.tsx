"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useWorkspacePeople } from "../../workspace/members/context/WorkspacePeopleContext";
import type { WritingTarget } from "../model/target";
import { WritingPanel } from "./panel/WritingPanel";
import css from "./writing.module.css";

export function WritingAction({ ru, capture, tabIndex, onOpenChange }: {
  ru: boolean; capture: () => WritingTarget | null; tabIndex?: number; onOpenChange?: (open: boolean) => void;
}) {
  const scope = useWorkspacePeople();
  const button = useRef<HTMLButtonElement>(null);
  const sequence = useRef(0);
  const [session, setSession] = useState<{ id: number; target: WritingTarget; workspaceId: string } | null>(null);
  const title = ru ? "Спросить Falcon AI" : "Ask Falcon AI";
  useEffect(() => { setSession(null); }, [scope.workspaceId]);
  function close(restore = true) {
    if (restore) session?.target.restore();
    setSession(null); onOpenChange?.(false);
  }
  return <>
    <button ref={button} type="button" className={css.sphereButton} aria-label={title} title={title}
      aria-haspopup="dialog" aria-expanded={Boolean(session)} tabIndex={tabIndex}
      disabled={!scope.workspaceId || scope.offline} onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        if (session) { close(); return; }
        const target = capture();
        if (target) { setSession({ id: ++sequence.current, target, workspaceId: scope.workspaceId }); onOpenChange?.(true); }
      }}><span className={css.sphere} aria-hidden="true" /></button>
    <AnimatePresence>{session && session.workspaceId === scope.workspaceId && <WritingPanel
      key={`${session.workspaceId}:${session.id}`} target={session.target} workspaceId={session.workspaceId} ru={ru}
      anchor={button} onClose={close} />}</AnimatePresence>
  </>;
}
