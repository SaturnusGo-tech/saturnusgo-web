import { maximumRecordingSeconds } from "../model/audio";
import css from "./RecordingStatus.module.css";

export function RecordingStatus({ elapsed, level, ru }: { elapsed: number; level: number; ru: boolean }) {
  const tenths = Math.floor(Math.max(0, Math.min(maximumRecordingSeconds, Number.isFinite(elapsed) ? elapsed : 0)) * 10 + .001);
  const signal = Math.max(0, Math.min(1, Number.isFinite(level) ? level : 0));
  const percent = Math.round(signal * 100);
  const duration = `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, "0")}.${tenths % 10}`;
  return <span className={css.status}>
    <span className={css.meter} role="meter" aria-label={ru ? "Уровень микрофона" : "Microphone level"}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${percent}%`}>
      {[5, 8, 11, 14, 17].map((height, index) => <span key={height} aria-hidden="true"
        className={css.bar} data-active={signal > index / 5 || undefined} style={{ height }} />)}
    </span>
    <span>{ru ? "Запись" : "Recording"}</span>
    <span className={css.timer} role="timer" aria-live="off" aria-label={ru ? "Длительность записи" : "Recording duration"}>
      {duration}<span className={css.limit}> / {maximumRecordingSeconds / 60}:00</span>
    </span>
  </span>;
}
