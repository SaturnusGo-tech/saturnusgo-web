"use client";

import { FreeSoloPopover } from "@heroui/popover";
import { Button } from "@heroui/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { WorkspaceActor } from "../../model/actors/workspace-actor";
import { MemberProfileContent } from "./MemberProfileContent";
import { memberProfileUrl } from "../../../../profile/navigation/member-profile-route";
import { visitWorkspace } from "../../../../state/navigation/browser/workspace-history";
import styles from "./member-profile-preview.module.css";

type Props = {
  workspaceId: string;
  identityId: string;
  name: string;
  locale: TmsLocale;
  offline?: boolean;
  actor?: WorkspaceActor | null;
  children: ReactNode;
  triggerLabel?: string;
  hoverOnly?: boolean;
  disabled?: boolean;
};

export function MemberProfilePreview({
  workspaceId, identityId, name, locale, offline, actor, children, triggerLabel, hoverOnly = false, disabled = false,
}: Props) {
  const anchor = useRef<HTMLSpanElement>(null!);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [preview, setPreview] = useState(false);
  const [placement, setPlacement] = useState<"left" | "right" | "bottom">("left");
  const cardId = useId();
  const isOpen = !disabled && preview;
  const label = locale === "ru" ? `Профиль: ${name}` : `Profile: ${name}`;

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (disabled) close(); }, [disabled]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    function position() {
      const rect = anchor.current.getBoundingClientRect();
      const room = Math.min(276, window.innerWidth - 20) + 18;
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
    }
    position();
    window.addEventListener("resize", position);
    document.addEventListener("keydown", dismiss, true);
    return () => { window.removeEventListener("resize", position); document.removeEventListener("keydown", dismiss, true); };
  }, [isOpen, cardId]);
  function close() {
    clearTimeout(timer.current);
    setPreview(false);
  }
  function schedulePreview(visible: boolean, delay: number) {
    clearTimeout(timer.current);
    if (disabled) return;
    timer.current = setTimeout(() => setPreview(visible), delay);
  }
  return <>
    <span ref={anchor} className={styles.anchor} data-hover-only={hoverOnly || undefined}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") schedulePreview(true, 180); }}
      onPointerLeave={(event) => { if (event.pointerType !== "touch") schedulePreview(false, 140); }}
      onFocus={(event) => { if (event.target.matches(":focus-visible")) schedulePreview(true, 0); }}
      onBlur={() => schedulePreview(false, 0)}
      >
      {hoverOnly ? children : <Button type="button" variant="light" disableRipple
        className={styles.trigger} isDisabled={disabled} onClick={event=>event.stopPropagation()} aria-label={triggerLabel ?? label}
        aria-expanded={isOpen} aria-controls={isOpen ? cardId : undefined}
        onPress={() => {
          close();
          visitWorkspace(memberProfileUrl(window.location.href, workspaceId, identityId));
        }}>
        {children}
      </Button>}
    </span>
    {isOpen && <FreeSoloPopover key={identityId} isOpen disableDialogFocus disableAnimation triggerRef={anchor}
      placement={placement} shouldFlip offset={8} containerPadding={10} shouldBlockScroll={false}
      classNames={{ base: styles.positioner, content: styles.surface }}
      dialogProps={{ "aria-label": label }} onOpenChange={(next) => { if (!next) close(); }}>
      <div id={cardId} className={styles.card}
        onPointerEnter={(event) => { if (event.pointerType !== "touch") schedulePreview(true, 0); }}
        onPointerLeave={(event) => { if (event.pointerType !== "touch") schedulePreview(false, 140); }}>
        <MemberProfileContent workspaceId={workspaceId} identityId={identityId} name={name} locale={locale}
          offline={offline} actor={actor} />
      </div>
    </FreeSoloPopover>}
  </>;
}
