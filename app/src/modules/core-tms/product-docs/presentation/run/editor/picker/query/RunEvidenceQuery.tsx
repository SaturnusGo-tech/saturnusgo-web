"use client";
import { AnchoredPopover as Popover } from "../../../../../../../../shared/components/anchored-popup/popover/AnchoredPopover";
import { PopoverContent } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { useId, type RefObject } from "react";
import type { TmsLocale } from "../../../../../../localization/model/locale";
import type { QueryMember } from "../../../../../../presentation/cases/model/query/match";
import { RunQueryFields } from "./fields/RunQueryFields";
import styles from "./run-evidence-query.module.css";

type Props = {
  locale: TmsLocale; query: string; open: boolean; disabled: boolean; instantClose: boolean;
  folders: string[]; components: string[]; tags: string[]; members: readonly QueryMember[];
  trigger: RefObject<HTMLInputElement>;
  onOpenChange(open: boolean): void; onQuery(query: string): void;
};

export function RunEvidenceQuery({ trigger, open, instantClose, onOpenChange, ...props }: Props) {
  const panelId = useId();
  const reduced = useReducedMotion();
  const label = props.locale === "ru" ? "QL-запрос" : "QL query";
  return <Popover triggerRef={trigger} isOpen={open} onOpenChange={onOpenChange}
    placement="bottom-end" offset={10} containerPadding={14} shouldBlockScroll={false}
    shouldCloseOnScroll={false} disableAnimation={instantClose || Boolean(reduced)}
    portalContainer={trigger.current?.closest<HTMLElement>('[role="dialog"]') ?? undefined}
    shouldCloseOnInteractOutside={(element) => !element.closest("[data-run-picker-tool]")}
    classNames={{ base: styles.positioner, content: styles.panel }} style={{ zIndex: 5 }}>
    <span hidden aria-hidden="true" />
    {!instantClose && <PopoverContent id={panelId} aria-label={label} onKeyDownCapture={(event) => {
      if (event.key !== "Escape" || event.nativeEvent.isComposing) return;
      event.preventDefault(); event.stopPropagation(); onOpenChange(false);
      requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
    }}><RunQueryFields {...props} /></PopoverContent>}
  </Popover>;
}
