import { ErrorToast } from "../../../../../../common/error/ErrorToast";
import { Input, Radio, RadioGroup } from "@heroui/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { DefectTriageCandidate, DefectTriageRow, DefectTriageSource } from "../../../../../../../defects/triage/defect-triage-source";
import { useTmsLocale } from "../../../../../../../localization/context/useTmsLocale";
import { triageCopy } from "../copy/triage-copy";
import shared from "../triage.module.css";
import styles from "./decision.module.css";

type Props = {
  row: DefectTriageRow;
  source: DefectTriageSource;
  disabled: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
};
type Results = { query: string; rows: DefectTriageCandidate[]; hasMore: boolean; failed: boolean };

export function DuplicatePicker({ row, source, disabled, selectedId, onSelect }: Props) {
  const { locale, t } = useTmsLocale();
  const copy = triageCopy[locale];
  const [draft, setDraft] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const query = draft.trim();
  const current = results?.query === query ? results : null;
  const { projectId, id: sourceId } = row;
  useEffect(() => {
    if (!query) return;
    const request = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const page = await source.candidates(projectId, query, sourceId, request.signal);
        if (!request.signal.aborted) setResults({ query, ...page, failed: false });
      } catch {
        if (!request.signal.aborted) setResults({ query, rows: [], hasMore: false, failed: true });
      }
    }, 220);
    return () => { window.clearTimeout(timer); request.abort(); };
  }, [source, projectId, sourceId, query, attempt]);

  return <div className={styles.search}>
    <Input type="search" label={copy.search} labelPlacement="outside-top" size="sm" variant="flat"
      startContent={<Search size={14} aria-hidden="true" />} value={draft} maxLength={500} isDisabled={disabled}
      classNames={{ label: styles.fieldLabel, inputWrapper: styles.fieldShell, input: styles.fieldInput }}
      onValueChange={value => {
        if (value.trim() !== query) { setResults(null); onSelect(""); }
        setDraft(value);
      }} />
    {query && !current && <p className={shared.context} role="status">{copy.searchPending}</p>}
    {query && current && (current.failed
      ? <ErrorToast message={copy.searchFailed} retryLabel={t("dashboardWorkbench.retry")}
        onRetry={() => { setResults(null); setAttempt(value => value + 1); }} />
      : <>
        {current.rows.length > 0 ? <RadioGroup aria-label={copy.search} value={selectedId} onValueChange={onSelect}
          isDisabled={disabled} classNames={{ wrapper: styles.candidates }}>
          {current.rows.map(candidate => <Radio key={candidate.id} value={candidate.id} size="sm"
            classNames={{ base: styles.radio, wrapper: styles.radioCircle, control: styles.radioDot, label: styles.radioLabel }}>
            <small>{candidate.key}</small> {candidate.title}
          </Radio>)}
        </RadioGroup> : !current.hasMore && <p className={shared.context} role="status">{copy.searchEmpty}</p>}
        {current.hasMore && <p className={shared.context}>{copy.searchMore}</p>}
      </>)}
  </div>;
}
