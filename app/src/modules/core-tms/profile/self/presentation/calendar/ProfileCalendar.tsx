"use client";
import { ErrorToast } from "../../../../presentation/common/error/ErrorToast";
import { RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { SelfProfileActivity } from "../../domain/profile-model";
import { profileCalendar } from "../../domain/calendar/profile-calendar";
import { profileCopy } from "../copy/profile-copy";
import styles from "./profile-calendar.module.css";

type Day = ReturnType<typeof profileCalendar>["days"][number];
type Hover = { day: Day; left: number; top: number; above: boolean };
export function ProfileCalendar({ value, loading, error, year, ru, onYear, retry }: {
  value: SelfProfileActivity | null; loading: boolean; error: unknown; year: number; ru: boolean;
  onYear: (year: number) => void; retry: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10), currentYear = Number(today.slice(0, 4));
  const calendar = useMemo(() => profileCalendar(year, value?.series ?? [], today), [year, value, today]);
  const [hover, setHover] = useState<Hover | null>(null), [focusDate, setFocusDate] = useState(`${year}-01-01`);
  const refs = useRef(new Map<string, HTMLButtonElement>()), tooltipId = useId(), copy = profileCopy(ru);
  useEffect(() => { setHover(null); setFocusDate(`${year}-01-01`); }, [year]);
  const locale = ru ? "ru-RU" : "en-US", numbers = new Intl.NumberFormat(locale);
  const plurals = new Intl.PluralRules(locale);
  const actionCount = (count: number) => `${numbers.format(count)} ${ru ? ({ one: "действие", few: "действия" } as Record<string, string>)[plurals.select(count)] ?? "действий" : count === 1 ? "recorded action" : "recorded actions"}`;
  const fullDate = (date: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  const show = (day: Day, event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect(), above = rect.top > 205;
    setHover({ day, left: Math.max(12, Math.min(window.innerWidth - 252, rect.left - 108)), top: above ? rect.top - 10 : rect.bottom + 10, above });
  };
  return <section className={styles.calendar} aria-label={ru ? "Календарь активности QA" : "QA activity calendar"} aria-busy={loading}>
    <header><div><h2>{ru ? "Активность QA" : "QA activity"}</h2><p>{loading ? (ru ? "Загружаем активность…" : "Loading activity…") : value ? actionCount(calendar.total) : (ru ? "В текущем пространстве" : "In this workspace")} · {year} · UTC</p></div>
      <div className={styles.years} role="group" aria-label={ru ? "Год активности" : "Activity year"}>{[currentYear, currentYear - 1].map(option => <button key={option} type="button" aria-pressed={year === option} onClick={() => onYear(option)}>{option}</button>)}</div>
    </header>
    {error ? <ErrorToast message={copy.activityError} retryLabel={copy.retry} onRetry={retry} />
      : !value ? <div className={styles.feedback}><p>{loading ? (ru ? "Собираем ваши результаты" : "Gathering your recorded work") : copy.noWorkspace}</p></div>
      : <><div className={styles.scroll}>
        <div className={styles.matrix} style={{ "--calendar-columns": calendar.columns } as CSSProperties}>
          <div className={styles.months}>{calendar.months.map(month => <span key={month.month} style={{ gridColumn: month.column }}>{new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month.month, 1)))}</span>)}</div>
          <div className={styles.weekdays} aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6].map(day => <span key={day} style={{ gridRow: day + 1 }}>{new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + day)))}</span>)}</div>
          <div className={styles.cells} role="group" aria-label={ru ? "Действия по дням; используйте стрелки для навигации" : "Daily QA activity; use arrow keys to navigate"}>
            {calendar.cells.map((day, index) => day ? <button key={day.date} type="button" ref={element => { if (element) refs.current.set(day.date, element); else refs.current.delete(day.date); }} data-level={day.level} data-future={day.future || undefined}
              disabled={day.future} tabIndex={focusDate === day.date ? 0 : -1} aria-label={`${fullDate(day.date)}: ${actionCount(day.count)}`} aria-describedby={hover?.day.date === day.date ? tooltipId : undefined}
              onMouseEnter={event => show(day, event)} onMouseLeave={() => setHover(null)} onFocus={event => { setFocusDate(day.date); show(day, event); }} onBlur={() => setHover(null)} onKeyDown={event => {
                if (event.key === "Escape") { setHover(null); return; }
                const delta = ({ ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 } as Record<string, number>)[event.key];
                if (!delta) return; event.preventDefault();
                const next = calendar.days[Math.max(0, Math.min(Math.min(calendar.days.length - 1, Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.UTC(year, 0, 1)) / 86_400_000)), calendar.days.findIndex(point => point.date === day.date) + delta))];
                if (next) { setFocusDate(next.date); refs.current.get(next.date)?.focus(); }
              }} /> : <span key={`empty-${index}`} />)}
          </div>
        </div>
      </div><footer><span>{ru ? "Кейсы, проверки и дефекты" : "Cases, checks and defects"}</span><div><span>{ru ? "Меньше" : "Less"}</span>{[0, 1, 2, 3, 4].map(level => <i key={level} data-level={level} />)}<span>{ru ? "Больше" : "More"}</span></div></footer></>}
    {hover && typeof document !== "undefined" && createPortal(<div id={tooltipId} role="tooltip" className={styles.tooltip} style={{ left: hover.left, top: hover.top, transform: hover.above ? "translateY(-100%)" : undefined }}>
      <time dateTime={hover.day.date}>{fullDate(hover.day.date)}</time><strong>{actionCount(hover.day.count)}</strong>
      <dl>{(["authoredCases", "executedCases", "defects", "runs"] as const).map(key => <div key={key}><dt>{copy.metrics[key]}</dt><dd>{numbers.format(hover.day[key])}</dd></div>)}</dl>
    </div>, document.body)}
  </section>;
}
