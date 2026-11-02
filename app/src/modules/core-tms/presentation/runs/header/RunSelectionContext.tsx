import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { RunClock } from "../clock/RunClock";
import { RunDetailsPopover } from "../repository/details/RunDetailsPopover";
import css from "./run-selection-context.module.css";

/** Run-level actions remain available even when no case matches the current filters. */
export function RunSelectionContext({ run }: { run: TestRunSummary }) {
  const { locale } = useTmsLocale();
  return <header className={css.header}>
    <strong className={css.title} title={run.name}>{run.name}</strong>
    <RunClock run={run} />
    <RunDetailsPopover run={run} ru={locale === "ru"} />
  </header>;
}
