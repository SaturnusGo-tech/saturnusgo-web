import { Button, Select, SelectItem, Textarea } from "@heroui/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState } from "react";
import { Check, Clock3, Copy, RotateCcw, X } from "lucide-react";
import type { DefectTriageDecision, DefectTriageRow, DefectTriageSource, DefectTriageView } from "../../../../../../../defects/triage/defect-triage-source";
import { useTmsLocale } from "../../../../../../../localization/context/useTmsLocale";
import dashboardStyles from "../../../../../dashboard.module.css";
import { triageCopy } from "../copy/triage-copy";
import shared from "../triage.module.css";
import { DuplicatePicker } from "./DuplicatePicker";
import styles from "./decision.module.css";

type Followup = "decline" | "duplicate" | "snooze";
const followups = { decline: X, duplicate: Copy, snooze: Clock3 };
type Props = {
  row: DefectTriageRow;
  view: DefectTriageView;
  saving: boolean;
  source: DefectTriageSource;
  onDecide: (decision: DefectTriageDecision) => void;
  onReset: () => void;
};

export function DefectDecision({ row, view, saving, source, onDecide, onReset }: Props) {
  const { locale, languageTag } = useTmsLocale();
  const reduced = useReducedMotion();
  const copy = triageCopy[locale];
  const [followup, setFollowup] = useState<Followup | null>(null);
  const [reason, setReason] = useState("");
  const [duplicateOfDefectId, setDuplicateOfDefectId] = useState("");
  const [dates, setDates] = useState(snoozeDates);
  const [snoozedUntil, setSnoozedUntil] = useState("");
  const decisionId = useId();
  const form = useRef<HTMLFormElement>(null);
  const initiators = useRef<Partial<Record<Followup, HTMLButtonElement | null>>>({});

  function prepare(action: Followup) {
    if (action === followup) return cancel();
    onReset();
    setReason("");
    setDuplicateOfDefectId("");
    if (action === "snooze") {
      const nextDates = snoozeDates();
      setDates(nextDates);
      setSnoozedUntil(nextDates[0]);
    }
    setFollowup(action);
  }

  function cancel() {
    setFollowup(null);
    onReset();
    if (followup) initiators.current[followup]?.focus();
  }

  const dateFormat = new Intl.DateTimeFormat(languageTag, { dateStyle: "medium", timeStyle: "short" });
  const immediate = view === "snoozed" ? "resume" : "accept";
  const ImmediateIcon = immediate === "resume" ? RotateCcw : Check;
  return <>
    <div className={styles.actions}>
      <Button type="button" size="sm" variant="bordered" disableRipple className={shared.primary} isDisabled={saving}
        startContent={<ImmediateIcon size={14} aria-hidden="true" />} onPress={() => onDecide({ action: immediate })}>
        {copy.decisions[immediate]}
      </Button>
      {view === "inbox" && (Object.keys(followups) as Followup[]).map(action => {
        const Icon = followups[action];
        return <Button type="button" key={action} size="sm" variant="flat" disableRipple className={shared.button}
          ref={button => { initiators.current[action] = button; }} isDisabled={saving}
          aria-expanded={followup === action} aria-controls={followup === action ? decisionId : undefined}
          startContent={<Icon size={14} aria-hidden="true" />} onPress={() => prepare(action)}>
          {copy.decisions[action]}
        </Button>;
      })}
    </div>
    <AnimatePresence initial={false} mode="wait">
      {followup && <motion.form key={followup} ref={form} className={styles.form} id={decisionId}
        aria-label={copy.decisions[followup]}
        initial="closed" animate="open" exit="closed"
        variants={{
          closed: { height: 0, opacity: 0, overflow: "hidden", pointerEvents: "none" },
          open: { height: "auto", opacity: 1, pointerEvents: "auto", transitionEnd: { overflow: "visible" } },
        }}
        transition={{ duration: reduced ? 0 : .16, ease: [.2, .8, .2, 1] }}
        onAnimationComplete={phase => {
          if (phase === "open") form.current?.querySelector<HTMLElement>(
            'textarea, input[type="search"], button[aria-haspopup="listbox"]',
          )?.focus({ preventScroll: true });
        }}
        onSubmit={event => {
          event.preventDefault();
          if (saving) return;
          if (followup === "decline") {
            const note = reason.trim();
            onDecide({ action: followup, ...(note && { reason: note }) });
          }
          if (followup === "duplicate" && duplicateOfDefectId) onDecide({ action: followup, duplicateOfDefectId });
          if (followup === "snooze" && snoozedUntil) onDecide({ action: followup, snoozedUntil });
        }}>
        <div className={styles.fields}>
          {followup === "decline" && <>
            <p className={shared.context}>{copy.declineHint}</p>
            <Textarea label={copy.reason} labelPlacement="outside-top" variant="flat" minRows={2} maxRows={5}
              maxLength={2000} value={reason} isDisabled={saving} onValueChange={setReason}
              classNames={{ label: styles.fieldLabel, inputWrapper: styles.fieldShell, input: styles.fieldInput }} />
          </>}
          {followup === "duplicate" && <>
            <p className={shared.context}>{copy.duplicateHint}</p>
            <DuplicatePicker key={row.id} row={row} source={source} disabled={saving}
              selectedId={duplicateOfDefectId} onSelect={setDuplicateOfDefectId} />
          </>}
          {followup === "snooze" && <div className={styles.snoozeField}>
            <span id={`${decisionId}-snooze`} className={styles.fieldLabel}>{copy.snoozeUntil}</span>
            <Select aria-labelledby={`${decisionId}-snooze`} size="sm" radius="sm" variant="flat"
              selectedKeys={snoozedUntil ? [snoozedUntil] : []} disallowEmptySelection isDisabled={saving}
              disableAnimation
              description={snoozedUntil && <time dateTime={snoozedUntil}>{dateFormat.format(new Date(snoozedUntil))}</time>}
              classNames={{ trigger: styles.fieldShell, value: styles.fieldInput,
                selectorIcon: styles.fieldIcon, description: styles.fieldLabel, popoverContent: `${styles.popover} ${dashboardStyles.popupEnter}` }}
              listboxProps={{ itemClasses: { base: styles.option } }}
              onSelectionChange={keys => { if (keys !== "all") setSnoozedUntil(String([...keys][0] ?? "")); }}>
              {[copy.tomorrow, copy.threeDays, copy.nextWeek].map((label, index) =>
                <SelectItem key={dates[index]}>{label}</SelectItem>)}
            </Select>
          </div>}
          <div className={styles.actions}>
            <Button type="submit" size="sm" variant="bordered" disableRipple className={shared.primary}
              isDisabled={saving || (followup === "duplicate" && !duplicateOfDefectId)}>
              {saving ? copy.saving : copy.decisions[followup]}
            </Button>
            <Button type="button" size="sm" variant="light" disableRipple className={shared.button}
              onPress={cancel} isDisabled={saving}>{copy.cancel}</Button>
          </div>
        </div>
      </motion.form>}
    </AnimatePresence>
  </>;
}

function snoozeDates() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return [tomorrow.toISOString(), ...[3, 7].map(days => {
    const date = new Date(now);
    date.setDate(now.getDate() + days);
    return date.toISOString();
  })];
}
