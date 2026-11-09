import { Button, Listbox, ListboxItem, Spinner } from "@heroui/react";
import { Check, Layers, Package, Plus, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { PropertyPopover, PropertySearch } from "../../../presentation/common/properties/select/PropertySelect";
import properties from "../../../presentation/common/properties/property-controls.module.css";
import { customFieldError } from "../../application/field-errors";
import { customFieldLabel, customValueLabel } from "../../application/field-labels";
import type { CustomFieldDefinition, CustomFieldScope, CustomFieldSelection } from "../../model/custom-field";
import { normalizedFieldLabel, parseFieldValue } from "../../model/field-validation";
import { useCustomFieldValues } from "../../state/values/useCustomFieldValues";
import { useFieldValueWrite } from "../../state/values/useFieldValueWrite";
import css from "./customFieldPicker.module.css";

export type CustomFieldPickerProps = CustomFieldScope & { field: CustomFieldDefinition;
  selected: readonly CustomFieldSelection[]; onChange(values: readonly CustomFieldSelection[]): void;
  parentValueId?: string | null; allowProductsWithoutGroup?: boolean; canCreate?: boolean; disabled?: boolean; placeholder?: string; displayValue?: string; invalid?: boolean; errorId?: string; autoOpen?: boolean };
export function CustomFieldPicker({ field, selected, onChange, parentValueId, allowProductsWithoutGroup = false, canCreate = false,
  disabled = false, placeholder, displayValue, invalid, errorId, autoOpen = false, workspaceId, projectId }: CustomFieldPickerProps) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [open, setOpen] = useState(false);
  const page = useCustomFieldValues({ workspaceId, projectId, fieldId: field.id, parentValueId, enabled: open && !disabled });
  const write = useFieldValueWrite({ workspaceId, projectId }, field.id, ru);
  const context = useRef("");
  context.current = `${workspaceId}:${projectId}:${field.id}:${parentValueId ?? ""}`;
  useEffect(() => { setOpen(false); }, [field.id, workspaceId, projectId, parentValueId, disabled]);
  useEffect(() => { if (autoOpen && !disabled) setOpen(true); }, [autoOpen, disabled]);
  const label = customFieldLabel(field, ru);
  const candidate = parseFieldValue(page.search, field.type);
  const exact = page.items.find(value => normalizedFieldLabel(value.label) === normalizedFieldLabel(page.search));
  const parentNeeded = field.systemKey === "product" && !parentValueId && !allowProductsWithoutGroup;
  const selectedKeys = new Set(selected.map(value => value.id));
  const trigger = <><CustomFieldIcon systemKey={field.systemKey} fallback={displayValue !== undefined} />
    <span>{displayValue ?? (selected.length ? selected.map(value => customValueLabel(value, ru)).join(", ") : placeholder ?? (ru ? "Выберите значение" : "Select a value"))}</span></>;

  function setMenu(next: boolean) {
    write.reset();
    page.setSearch("");
    setOpen(next);
  }

  function choose(value: CustomFieldSelection) {
    if (parentNeeded && value.parentValueId) return;
    const next = field.multiple ? (selectedKeys.has(value.id)
      ? selected.filter(item => item.id !== value.id) : [...selected, value]) : [value];
    onChange(next);
    if (!field.multiple) setMenu(false);
  }

  async function create(confirmedSimilarValueIds?: readonly string[]) {
    if (candidate === null || parentNeeded || disabled || !canCreate) return;
    const startedIn = context.current;
    const value = await write.save({ value: candidate, parentValueId, confirmedSimilarValueIds });
    if (value && context.current === startedIn) { choose(value); page.refresh(); page.setSearch(""); }
  }

  return <PropertyPopover label={label} trigger={trigger} open={open} onOpenChange={setMenu}
    disabled={disabled} invalid={invalid} errorId={errorId}>
    <PropertySearch label={ru ? "Найти значение" : "Find a value"} value={page.search} disabled={write.pending}
      onChange={value => { page.setSearch(value); write.reset(); }} />
    <Listbox aria-label={label} aria-busy={page.loading} selectionMode={field.multiple ? "multiple" : "single"}
      hideSelectedIcon selectedKeys={selectedKeys} disabledKeys={page.items.filter(value => parentNeeded && value.parentValueId).map(value => value.id)}
      classNames={{ base: properties.list, list: properties.options }} itemClasses={{ base: properties.option, title: properties.optionTitle }}
      emptyContent={page.loading || page.failure ? null : ru ? "Значения не найдены" : "No values found"}>
      {page.items.map(value => <ListboxItem key={value.id} textValue={customValueLabel(value, ru)} onPress={() => choose(value)}
        endContent={selectedKeys.has(value.id) ? <Check size={14} className={properties.selectedIcon} aria-hidden="true" /> : undefined}>
        {customValueLabel(value, ru)}
      </ListboxItem>)}
    </Listbox>
    {parentNeeded && <p className={css.hint}>{ru ? "Выберите группу для выбора её продуктов. Прежние значения без группы доступны ниже." : "Choose a group to select its products. Existing unclassified values remain available."}</p>}
    {page.loading && <Spinner size="sm" aria-label={ru ? "Загрузка…" : "Loading…"} />}
    {!!page.failure && <div role="alert" className={css.hint}>{customFieldError(page.failure, ru)}
      <Button type="button" size="sm" variant="light" onPress={page.refresh}>{ru ? "Повторить" : "Retry"}</Button>
    </div>}
    {page.cursor && <Button type="button" size="sm" variant="light" className={properties.add}
      isDisabled={page.pending} onPress={() => void page.more()}>{ru ? "Показать ещё" : "Load more"}</Button>}
    {selected.length > 0 && <Button type="button" size="sm" variant="light" className={properties.add} onPress={() => { onChange([]); setMenu(false); }}>
      <X size={13} aria-hidden="true" />{ru ? "Очистить" : "Clear"}
    </Button>}
    {canCreate && page.search.trim() && !exact && <div className={css.creation}>
      {write.conflict ? <>
        <p className={css.hint}>{write.conflict.kind === "exact" ? (ru ? "Такое значение уже есть:" : "This value already exists:") : (ru ? "Найдены похожие значения:" : "Similar values found:")}</p>
        {write.conflict.values.map(value => <Button type="button" size="sm" variant="light" key={value.id}
          className={properties.add} isDisabled={Boolean(value.archivedAt || (parentNeeded && value.parentValueId))}
          onPress={() => choose(value)}>{value.label}{value.archivedAt ? (ru ? " · в архиве" : " · archived") : ""}</Button>)}
        {write.conflict.kind === "similar" && <Button type="button" size="sm" variant="light" className={properties.add}
          isDisabled={write.pending} onPress={() => void create(write.conflict!.values.map(value => value.id))}>
          {ru ? "Создать отдельное значение" : "Create a separate value"}
        </Button>}
      </> : <Button type="button" size="sm" variant="light" className={properties.add}
        isDisabled={candidate === null || parentNeeded || write.pending || page.loading} onPress={() => void create()}>
        <Plus size={14} aria-hidden="true" />{ru ? "Создать" : "Create"} «{page.search.trim()}»
      </Button>}
      {parentNeeded && <p className={css.hint}>{ru ? "Сначала выберите группу продуктов." : "Choose a product group first."}</p>}
      {candidate === null && !parentNeeded && <p className={css.hint}>{ru ? "Введите значение выбранного типа." : "Enter a value of the selected type."}</p>}
      {write.error && <p role="alert" className={css.error}>{write.error}</p>}
    </div>}
  </PropertyPopover>;
}

export function CustomFieldIcon({ systemKey, fallback }: Pick<CustomFieldDefinition, "systemKey"> & { fallback?: boolean }) {
  const Icon = systemKey === "product_group" ? Layers : systemKey === "product" ? Package : systemKey === "regression" ? RotateCcw : fallback ? SlidersHorizontal : null;
  return Icon ? <Icon size={15} aria-hidden="true" /> : null;
}
