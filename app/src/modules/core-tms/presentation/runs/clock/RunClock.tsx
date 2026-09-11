import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";

export function RunClock({ run }: { run: TestRunSummary }) {
  const [tick, setTick] = useState({ at: performance.now(), elapsed: 0 });
  useEffect(() => {
    const at = performance.now(); setTick({ at, elapsed: 0 });
    if (!run.activeSince) return;
    const timer = setInterval(() => setTick({ at, elapsed: performance.now() - at }), 1000);
    return () => clearInterval(timer);
  }, [run.id, run.activeSince, run.measuredAt, run.elapsedMilliseconds]);
  const active = run.activeSince && run.measuredAt ? Math.max(0, Date.parse(run.measuredAt) - Date.parse(run.activeSince)) + tick.elapsed : 0;
  const seconds = Math.floor(((run.elapsedMilliseconds ?? 0) + active) / 1000);
  const display = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((n) => String(n).padStart(2, "0")).join(":");
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontVariantNumeric: "tabular-nums" }}>
    <Clock3 size={14} aria-hidden="true" /><time aria-label="Run time">{display}</time></span>;
}
