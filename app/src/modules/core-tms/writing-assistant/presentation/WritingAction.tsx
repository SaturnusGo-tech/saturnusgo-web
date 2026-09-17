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
  const pending = useRef<WritingTarget | null | undefined>(undefined);
  const [session, setSession] = useState<{ id: number; target: WritingTarget; workspaceId: string } | null>(null);
  const title = ru ? "Спросить Falcon AI" : "Ask Falcon AI";
  useEffect(() => { setSession(null); }, [scope.workspaceId]);
  useEffect(() => session?.target.highlight?.(), [session]);
  function close(restore = true) {
    if (restore) session?.target.restore();
    setSession(null); onOpenChange?.(false);
  }
  return <>
    <button ref={button} type="button" className={css.sphereButton} aria-label={title} title={title}
      aria-haspopup="dialog" aria-expanded={Boolean(session)} tabIndex={tabIndex}
      disabled={!scope.workspaceId || scope.offline}
      onPointerDown={(event) => {
        if (event.button !== 0 || !event.isPrimary) return;
        event.preventDefault();
        pending.current = session ? undefined : capture();
      }}
      onPointerCancel={() => { pending.current = undefined; }}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        if (session) { close(); return; }
        const target = event.detail === 0 || pending.current === undefined ? capture() : pending.current;
        pending.current = undefined;
        if (target) { setSession({ id: ++sequence.current, target, workspaceId: scope.workspaceId }); onOpenChange?.(true); }
      }}><span className={css.sphere} aria-hidden="true" /></button>
    <AnimatePresence>{session && session.workspaceId === scope.workspaceId && <WritingPanel
      key={`${session.workspaceId}:${session.id}`} target={session.target} workspaceId={session.workspaceId} ru={ru}
      anchor={button} onClose={close} />}</AnimatePresence>
  </>;
}
