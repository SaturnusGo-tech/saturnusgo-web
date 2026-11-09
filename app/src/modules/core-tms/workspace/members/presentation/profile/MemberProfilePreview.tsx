"use client";

import { FreeSoloPopover } from "@heroui/popover";
import { Button } from "@heroui/react";
import { AnimatePresence } from "framer-motion";
import { Bot, Clock3 } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { MemberAvatar } from "../../avatar/MemberAvatar";
import type { WorkspaceActor } from "../../model/actors/workspace-actor";
import { useWorkspaceActor } from "../../state/actors/useWorkspaceActor";
import styles from "./member-profile-preview.module.css";

type Props = {
  workspaceId: string;
  identityId: string;
  name: string;
  locale: TmsLocale;
  offline?: boolean;
  actor?: WorkspaceActor | null;
  children: ReactNode;
  hoverOnly?: boolean;
  disabled?: boolean;
  triggerLabel?: string;
};

export function MemberProfilePreview({
  workspaceId, identityId, name, locale, offline, actor, children, hoverOnly, disabled, triggerLabel,
}: Props) {
  const anchor = useRef<HTMLSpanElement>(null!);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [preview, setPreview] = useState(false);
  const [pinned, setPinned] = useState(false);
  const cardId = useId();
  const isOpen = !disabled && (preview || pinned);
  const label = locale === "ru" ? `Профиль: ${name}` : `Profile: ${name}`;

  useEffect(() => {
    if (disabled) {
      clearTimeout(timer.current);
      setPreview(false);
      setPinned(false);
    }
  }, [disabled]);
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!isOpen) return;
    function dismiss(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      clearTimeout(timer.current);
      setPreview(false);
      setPinned(false);
    }
    document.addEventListener("keydown", dismiss, true);
    return () => document.removeEventListener("keydown", dismiss, true);
  }, [isOpen]);

  function close() {
    clearTimeout(timer.current);
    setPreview(false);
    setPinned(false);
  }

  function schedulePreview(visible: boolean, delay: number) {
    clearTimeout(timer.current);
    if (disabled || pinned) return;
    timer.current = setTimeout(() => setPreview(visible), delay);
  }

  return <>
    <span ref={anchor} className={styles.anchor}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") schedulePreview(true, 180); }}
      onPointerLeave={(event) => { if (event.pointerType !== "touch") schedulePreview(false, 140); }}
      onFocus={(event) => { if (event.target.matches(":focus-visible")) schedulePreview(true, 0); }}
      onBlur={() => schedulePreview(false, 0)}>
      {hoverOnly ? children : <Button type="button" variant="light" disableRipple
        className={styles.trigger} aria-label={triggerLabel ?? label} aria-haspopup="dialog"
        aria-expanded={isOpen} aria-controls={isOpen ? cardId : undefined}
        onPress={() => {
          if (pinned) close();
          else {
            clearTimeout(timer.current);
            setPinned(true);
          }
        }}>
        {children}
      </Button>}
    </span>
    <AnimatePresence>
      {isOpen && <FreeSoloPopover key={identityId} isOpen disableDialogFocus triggerRef={anchor}
        placement="left" offset={8} containerPadding={10} shouldBlockScroll={false}
        classNames={{ base: styles.positioner, content: styles.surface }}
        dialogProps={{ "aria-label": label }} onOpenChange={(next) => { if (!next) close(); }}>
        <div id={cardId} className={styles.card}
          onPointerEnter={(event) => { if (event.pointerType !== "touch") schedulePreview(true, 0); }}
          onPointerLeave={(event) => { if (event.pointerType !== "touch") schedulePreview(false, 140); }}>
          <MemberProfileContent workspaceId={workspaceId} identityId={identityId} name={name} locale={locale}
            offline={offline} actor={actor} />
        </div>
      </FreeSoloPopover>}
    </AnimatePresence>
  </>;
}

function MemberProfileContent({ workspaceId, identityId, name, locale, offline, actor }: Omit<Props, "children" | "hoverOnly" | "disabled" | "triggerLabel">) {
  const { actor: resolved } = useWorkspaceActor(workspaceId, identityId, offline,
    actor?.kind === "agent" ? actor : undefined, { includeSignIn: true });
  const member = resolved ?? actor;
  const displayName = member?.name ?? name;
  const lastSignedInAt = member?.kind === "human" ? member.lastSignedInAt : null;
  const signIn = lastSignedInAt ? new Date(lastSignedInAt) : null;
  const signInText = signIn && Number.isFinite(signIn.getTime())
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(signIn) : null;
  return <>
    <div className={styles.heading}>
      <span className={styles.avatar}>
        <MemberAvatar workspaceId={workspaceId} actor={member} identityId={identityId} name={displayName} offline={offline} />
      </span>
      <div className={styles.identity}>
        <strong>{displayName}</strong>
        {member?.kind === "human" && member.email && <span>{member.email}</span>}
      </div>
    </div>
    {signInText && <div className={styles.detail}>
      <Clock3 size={14} aria-hidden="true" />
      <div className={styles.signIn}>
        <span>{locale === "ru" ? "Последний вход" : "Last sign-in"}</span>
        <time dateTime={lastSignedInAt ?? undefined}>{signInText}</time>
      </div>
    </div>}
    {member?.kind === "agent" && <div className={styles.detail}>
      <Bot size={14} aria-hidden="true" />{locale === "ru" ? "Агент Codex" : "Codex agent"}
    </div>}
  </>;
}
