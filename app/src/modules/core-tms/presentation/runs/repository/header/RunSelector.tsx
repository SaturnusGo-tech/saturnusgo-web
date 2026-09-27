import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Pencil, Search } from "lucide-react";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../../../localization/format/labels";
import { isHistoricalRunChoice } from "../../../../runs/model/history/run-history";
import css from "./run-header.module.css";

export function RunSelector({ ru, choices, value, onChoose, onEdit, disabled }: {
  ru: boolean; value: string; disabled: boolean; onEdit?: () => void;
  choices: { id: string; name: string; tags: string[]; runs: TestRunSummary[] }[]; onChoose: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visible = open && !disabled;
  const selected = choices.find(c => c.id === value); const run = selected?.runs[0];
  const statusLabel = (run?: TestRunSummary) => run?.archivedAt ? (ru ? "Архив" : "Archived") : run?.status === "paused"
    ? (ru ? "Пауза" : "Paused") : localizedLabel(ru ? "ru" : "en", run?.status ?? "draft");
  const status = statusLabel(run);
  const matches = choices.filter(choice => `${choice.name} ${choice.tags.join(" ")}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const working = matches.filter(choice => !isHistoricalRunChoice(choice));
  const archived = matches.filter(isHistoricalRunChoice);
  const archiveCount = choices.filter(isHistoricalRunChoice).length;
  const choose = (id: string) => { if (disabled) return; onChoose(id); setOpen(false); trigger.current?.focus(); };
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-run-select]"));
    if (!buttons.length) return;
    event.preventDefault();
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const index = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : current < 0 ? (event.key === "ArrowDown" ? 0 : buttons.length - 1)
      : (current + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length;
    buttons[index]?.focus();
  }
  const options = (list: typeof choices, label: string) => <div role="group" aria-label={label} className={css.choices} onKeyDown={navigate}>
    {list.map(choice => <div className={css.choice} key={choice.id} data-run-choice={choice.id} data-selected={choice.id === value}>
      <button type="button" data-run-select aria-pressed={choice.id === value} className={css.choose} onClick={() => choose(choice.id)}>
        <span>{choice.name}<small>{[statusLabel(choice.runs[0]), ...choice.tags].join(" · ")}</small></span>
      </button>
      {choice.id === value && onEdit && !isHistoricalRunChoice(choice) && <button type="button" className={css.edit}
        aria-label={ru ? "Редактировать прогон" : "Edit run"} title={ru ? "Редактировать прогон" : "Edit run"}
        onClick={event => { event.stopPropagation(); if (disabled) return; onEdit(); setOpen(false); }}><Pencil size={14} aria-hidden="true"/></button>}
      {choice.id === value && <Check size={13} aria-hidden="true"/>}
    </div>)}
  </div>;
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => {
    if (!visible) return; root.current?.querySelector("input")?.focus();
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close);
  }, [visible]);
  return <div className={css.selector} ref={root} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <span className={css.caption}>{ru ? "Текущий прогон" : "Current run"}</span>
    <button ref={trigger} type="button" className={css.current} aria-haspopup="dialog" aria-expanded={visible} disabled={disabled}
      onClick={() => { if (!open) { setArchiveOpen(false); setQuery(""); } setOpen(!open); }}>
      <strong>{selected?.name ?? (ru ? "Выберите прогон" : "Choose a run")}</strong><ChevronDown size={13}/>
      {run && <span className={css.status} data-status={run.status}>{status}</span>}
    </button>
    {visible && <div className={css.menu} role="dialog" aria-label={ru ? "Выбрать прогон" : "Choose a run"}>
      <label className={css.search}><Search size={14} aria-hidden="true"/><input
        aria-label={ru ? "Найти прогон или тег" : "Find run or tag"} placeholder={ru ? "Найти прогон или тег" : "Find run or tag"}
        value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => {
          if (event.key === "ArrowDown") { event.preventDefault(); root.current?.querySelector<HTMLButtonElement>("[data-run-select], [data-archive-toggle]")?.focus(); }
        }}/></label>
      {options(working, ru ? "Текущие прогоны" : "Current runs")}
      {!working.length && <p className={css.empty}>{query ? (ru ? "Нет текущих прогонов по запросу" : "No current runs match") : (ru ? "Нет текущих прогонов" : "No current runs")}</p>}
      {archiveCount > 0 && <>
        <button type="button" data-archive-toggle className={css.archiveToggle} aria-expanded={archiveOpen}
          onClick={() => setArchiveOpen(!archiveOpen)}><span>{ru ? "Архивные раны" : "Archived runs"}</span>
          <ChevronDown size={14} className={archiveOpen ? css.expanded : undefined}/><small>{query ? archived.length : archiveCount}</small></button>
        {archiveOpen && <div className={css.archiveList}>
          {options(archived, ru ? "Архивные раны" : "Archived runs")}
          {!archived.length && <p className={css.empty}>{ru ? "Нет архивных прогонов по запросу" : "No archived runs match"}</p>}
        </div>}
      </>}
    </div>}
  </div>;
}
