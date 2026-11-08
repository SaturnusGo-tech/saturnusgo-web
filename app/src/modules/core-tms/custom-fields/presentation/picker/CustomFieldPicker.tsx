import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useAnchoredPopup } from "../../../presentation/common/popup/useAnchoredPopup";
import popup from "../../../presentation/common/popup/caseFieldPopup.module.css";
import { customFieldError } from "../../application/field-errors";
import { customFieldLabel, customValueLabel } from "../../application/field-labels";
import type { CustomFieldDefinition, CustomFieldScope, CustomFieldSelection } from "../../model/custom-field";
import { normalizedFieldLabel, parseFieldValue } from "../../model/field-validation";
import { useCustomFieldValues } from "../../state/values/useCustomFieldValues";
import { useFieldValueWrite } from "../../state/values/useFieldValueWrite";
import css from "./customFieldPicker.module.css";

export type CustomFieldPickerProps = CustomFieldScope & { field: CustomFieldDefinition;
  selected: readonly CustomFieldSelection[]; onChange(values: readonly CustomFieldSelection[]): void;
  parentValueId?: string | null; allowProductsWithoutGroup?: boolean; canCreate?: boolean; disabled?: boolean; placeholder?: string; invalid?: boolean; errorId?: string; autoOpen?: boolean };
export function CustomFieldPicker({ field, selected, onChange, parentValueId, allowProductsWithoutGroup = false, canCreate = false,
  disabled = false, placeholder, invalid, errorId, autoOpen = false, workspaceId, projectId }: CustomFieldPickerProps) {
  const { locale } = useTmsLocale(); const ru = locale === "ru"; const id = useId();
  const [open, setOpen] = useState(false); const [opened, setOpened] = useState(false); const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null); const panel = useRef<HTMLDivElement>(null); const search = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const values = useCustomFieldValues({ workspaceId, projectId, fieldId: field.id, parentValueId, enabled: open });
  const visiblePage = useRef(values);
  const page = open ? values : visiblePage.current;
  const write = useFieldValueWrite({ workspaceId, projectId }, field.id, ru);
  const context = useRef(""); context.current = `${workspaceId}:${projectId}:${field.id}:${parentValueId ?? ""}`;
  useAnchoredPopup(open, false, root, trigger, panel, close, 310);
  useEffect(() => { if (open) visiblePage.current = values; }, [open, values]);
  useEffect(() => {
    if (!open) return;
    setOpened(true);
    search.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => { close(); }, [field.id, workspaceId, projectId, parentValueId, disabled, close]);
  useEffect(() => {
    if (autoOpen && !disabled) setOpen(true);
  }, [autoOpen, disabled]);
  const label = customFieldLabel(field, ru); const candidate = parseFieldValue(page.search, field.type);
  const exact = page.items.find(value => normalizedFieldLabel(value.label) === normalizedFieldLabel(page.search));
  const parentNeeded = field.systemKey === "product" && !parentValueId && !allowProductsWithoutGroup;
  function choose(value: CustomFieldSelection) {
    if (parentNeeded && value.parentValueId) return;
    const next = field.multiple ? (selected.some(item => item.id === value.id)
      ? selected.filter(item => item.id !== value.id) : [...selected, value]) : [value];
    onChange(next); if (!field.multiple) { close(); trigger.current?.focus({ preventScroll: true }); }
  }
  async function create(confirmedSimilarValueIds?: readonly string[]) {
    if (candidate === null || parentNeeded || disabled || !canCreate) return;
    const startedIn = context.current;
    const value = await write.save({ value: candidate, parentValueId, confirmedSimilarValueIds });
    if (value && context.current === startedIn) { choose(value); page.refresh(); page.setSearch(""); }
  }
  function closeWithFocus() { close(); trigger.current?.focus({ preventScroll: true }); }
  return <div className={css.root} ref={root} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); closeWithFocus(); }
    if (open && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      const options = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>("[role=option]:not(:disabled)") ?? []);
      if (!options.length) return; event.preventDefault();
      const current = options.indexOf(document.activeElement as HTMLButtonElement);
      options[(current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
    }
  }} onBlur={event => { if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) close(); }}>
    <button ref={trigger} type="button" className={`${css.trigger} ${popup.trigger} ${popup.valueTrigger}`} disabled={disabled} aria-label={label}
      aria-invalid={invalid || undefined} aria-describedby={errorId} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => { write.reset(); page.setSearch(""); setOpen(value => !value); }}>
      <span className={popup.valueLabel}>{selected.length ? selected.map(value => customValueLabel(value, ru)).join(", ") : placeholder ?? (ru ? "Выберите значение" : "Select a value")}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </button>
    {(open || opened) && <div ref={panel} className={`${css.panel} ${popup.panel}`} id={id} popover="manual" role="dialog" aria-label={label}
      data-open={open} aria-hidden={!open} inert={!open}>
      <label className={`${css.search} ${popup.search}`} data-input-shell><Search size={14} aria-hidden="true" /><input ref={search} value={page.search} disabled={write.pending}
        placeholder={ru ? "Найти значение" : "Find a value"} aria-label={ru ? "Найти значение" : "Find a value"}
        onChange={event => { page.setSearch(event.target.value); write.reset(); }} /></label>
      <div className={css.options} role="listbox" aria-label={label} aria-multiselectable={field.multiple} aria-busy={page.loading}>
        {page.items.map(value => <button type="button" role="option" className={popup.option} key={value.id} aria-selected={selected.some(item => item.id === value.id)} disabled={Boolean(parentNeeded && value.parentValueId)}
          onClick={() => choose(value)}><span><span className={popup.optionLabel}>{customValueLabel(value, ru)}</span></span>{selected.some(item => item.id === value.id) && <Check size={14} aria-hidden="true" />}</button>)}
      </div>
      {parentNeeded && <p className={css.hint}>{ru ? "Выберите группу для выбора её продуктов. Прежние значения без группы доступны ниже." : "Choose a group to select its products. Existing unclassified values remain available."}</p>}
      {page.loading && <p className={css.hint} role="status">{ru ? "Загрузка…" : "Loading…"}</p>}
      {!page.loading && !page.failure && !page.items.length && <p className={css.hint}>{ru ? "Значения не найдены" : "No values found"}</p>}
      {!!page.failure && <div role="alert" className={css.hint}>{customFieldError(page.failure, ru)}<button type="button" onClick={page.refresh}>{ru ? "Повторить" : "Retry"}</button></div>}
      {page.cursor && <button type="button" className={css.secondary} disabled={page.pending} onClick={() => void page.more()}>{ru ? "Показать ещё" : "Load more"}</button>}
      {selected.length > 0 && <button type="button" className={css.secondary} onClick={() => { onChange([]); closeWithFocus(); }}><X size={13} />{ru ? "Очистить" : "Clear"}</button>}
      {canCreate && page.search.trim() && !exact && <div className={css.creation}>
        {write.conflict ? <><p>{write.conflict.kind === "exact" ? (ru ? "Такое значение уже есть:" : "This value already exists:") : (ru ? "Найдены похожие значения:" : "Similar values found:")}</p>
          {write.conflict.values.map(value => <button type="button" key={value.id} className={css.existing} disabled={Boolean(value.archivedAt || (parentNeeded && value.parentValueId))} onClick={() => choose(value)}>{value.label}{value.archivedAt ? (ru ? " · в архиве" : " · archived") : ""}</button>)}
          {write.conflict.kind === "similar" && <button type="button" className={css.create} disabled={write.pending} onClick={() => void create(write.conflict!.values.map(value => value.id))}>{ru ? "Создать отдельное значение" : "Create a separate value"}</button>}
        </> : <button type="button" className={css.create} disabled={candidate === null || parentNeeded || write.pending || page.loading}
          onClick={() => void create()}><Plus size={14} /><span>{ru ? "Создать" : "Create"} «{page.search.trim()}»</span></button>}
        {parentNeeded && <p className={css.hint}>{ru ? "Сначала выберите группу продуктов." : "Choose a product group first."}</p>}
        {candidate === null && !parentNeeded && <p className={css.hint}>{ru ? "Введите значение выбранного типа." : "Enter a value of the selected type."}</p>}
        {write.error && <p role="alert" className={css.error}>{write.error}</p>}
      </div>}
    </div>}
  </div>;
}
