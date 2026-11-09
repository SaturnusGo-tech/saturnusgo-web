"use client";

import { FreeSoloPopover } from "@heroui/popover";
import { Button } from "@heroui/react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { Bot, Clock3, SquareUserRound } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FalconTooltip } from "../../../../presentation/common/tooltip/FalconTooltip";
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
  const [placement, setPlacement] = useState<"left" | "right" | "bottom">("left");
  const cardId = useId();
  const reducedMotion = useReducedMotion();
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

  useLayoutEffect(() => {
    if (!isOpen) return;
    function position() {
      const rect = anchor.current.getBoundingClientRect();
      const room = Math.min(373, window.innerWidth - 20) + 18;
      setPlacement(rect.left >= room ? "left" : window.innerWidth - rect.right >= room ? "right" : "bottom");
    }
    function dismiss(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      if (document.getElementById(cardId)?.contains(document.activeElement))
        anchor.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
      clearTimeout(timer.current);
      setPreview(false);
      setPinned(false);
    }
    position();
    window.addEventListener("resize", position);
    document.addEventListener("keydown", dismiss, true);
    return () => { window.removeEventListener("resize", position); document.removeEventListener("keydown", dismiss, true); };
  }, [isOpen, cardId]);
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
      onBlur={() => schedulePreview(false, 0)}
      onKeyDown={(event) => {
        if (!pinned || event.key !== "Tab" || event.shiftKey) return;
        const target = document.getElementById(cardId)?.querySelector<HTMLElement>("[data-profile-clock]");
        if (target) { event.preventDefault(); target.focus(); }
      }}>
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
        placement={placement} shouldFlip offset={8} containerPadding={10} shouldBlockScroll={false} disableAnimation={Boolean(reducedMotion)}
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

const avatarColors = ["#f98d5a", "#6f79cf", "#548a81", "#b86381", "#7e60ad", "#a6714d"];

function avatarColor(identityId: string) {
  let hash = 0;
  for (const character of identityId) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0;
  return avatarColors[(hash >>> 0) % avatarColors.length];
}

function useMemberLocalTime(locale: TmsLocale, timeZone?: string | null) {
  const formatter = useMemo(() => {
    if (!timeZone) return null;
    try {
      return new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    } catch {
      return null;
    }
  }, [locale, timeZone]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!formatter) return;
    const timer = setTimeout(() => setNow(Date.now()), 60_000 - (Date.now() % 60_000));
    return () => clearTimeout(timer);
  }, [formatter, now]);
  return formatter?.format(now);
}

function MemberProfileContent({ workspaceId, identityId, name, locale, offline, actor }: Omit<Props, "children" | "hoverOnly" | "disabled" | "triggerLabel">) {
  const { actor: resolved } = useWorkspaceActor(workspaceId, identityId, offline,
    actor?.kind === "agent" ? actor : undefined, { includeSignIn: true });
  const member = resolved ?? actor;
  const human = member?.kind === "human" ? member : null;
  const agent = member?.kind === "agent";
  const displayName = member?.name ?? name;
  const presence = human?.presence;
  const localTime = useMemberLocalTime(locale, human?.timeZone);
  const lastSignedInAt = human?.lastSignedInAt;
  const signIn = lastSignedInAt ? new Date(lastSignedInAt) : null;
  const signInText = signIn && Number.isFinite(signIn.getTime())
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(signIn) : null;
  const showSignIn = signInText && (!localTime || presence !== "online");
  const ru = locale === "ru";
  const signInLabel = ru ? "Последний вход" : "Last sign-in";
  return <>
    <div className={styles.heading}>
      <span className={styles.avatar} data-human={agent ? undefined : true}
        style={{ "--member-avatar-color": avatarColor(identityId) } as CSSProperties}>
        <MemberAvatar workspaceId={workspaceId} actor={member} identityId={identityId} name={displayName} offline={offline} />
      </span>
      <div className={styles.identity}>
        <strong>{displayName}</strong>
        {human?.email && <span>{human.email}</span>}
      </div>
    </div>
    {(presence || localTime || showSignIn || human?.workspaceName || agent) && <div className={styles.details}>
      {presence && <div className={styles.row}>
        <span className={styles.presence} data-presence={presence} aria-hidden="true" />
        <span>{presence === "online" ? (ru ? "В сети" : "Online") : (ru ? "Не в сети" : "Offline")}</span>
      </div>}
      {localTime && <div className={styles.row}>
        <Clock3 size={20} aria-hidden="true" />
        <FalconTooltip label={`${signInLabel} · ${signInText ?? ""}`} isDisabled={!signInText || Boolean(showSignIn)} className={styles.signInTooltip}>
          <span data-profile-clock={signInText && !showSignIn ? true : undefined}
            tabIndex={signInText && !showSignIn ? 0 : undefined}>
            <time dateTime={localTime}>{localTime}</time> <span className={styles.muted}>{ru ? "местное время" : "local time"}</span>
          </span>
        </FalconTooltip>
      </div>}
      {showSignIn && <div className={styles.row}>
        <Clock3 size={20} aria-hidden="true" />
        <span><span className={styles.muted}>{signInLabel}</span>{" "}
          <time dateTime={lastSignedInAt ?? undefined}>{signInText}</time></span>
      </div>}
      {human?.workspaceName && <div className={styles.row} data-workspace>
        <SquareUserRound size={20} aria-hidden="true" /><span>{human.workspaceName}</span>
      </div>}
      {agent && <div className={styles.row}><Bot size={20} aria-hidden="true" /><span>{ru ? "Агент Codex" : "Codex agent"}</span></div>}
    </div>}
  </>;
}
