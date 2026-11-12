"use client";
import { Select, SelectItem } from "@heroui/react";
import { useEffect, useState, type ReactNode } from "react";
import { createIntegrationSelection, type IntegrationOption } from "../selection/integration-selection";
import { useIntegrationControlDisabled } from "../scope/useIntegrationControlDisabled";
import { IntegrationSelectTrigger } from "../select-trigger/IntegrationSelectTrigger";
import css from "../styles/integration-controls.module.css";

type Props = { label?: ReactNode; description?: ReactNode; "aria-label"?: string; value: string;
  options: readonly IntegrationOption[]; onValueChange: (value: string) => void; isDisabled?: boolean;
  isRequired?: boolean; placeholder?: string; className?: string };

export function IntegrationSelect({ value, options, onValueChange, isDisabled, className, ...props }: Props) {
  const disabled = useIntegrationControlDisabled(isDisabled), model = createIntegrationSelection(options, [value]);
  const accessibleLabel = props["aria-label"] ?? (typeof props.label === "string" ? props.label : undefined);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  return <Select as={IntegrationSelectTrigger} size="sm" variant="flat" labelPlacement="outside" disallowEmptySelection {...props} aria-label={props.label ? undefined : props["aria-label"]} isDisabled={disabled}
    isOpen={open && !disabled} onOpenChange={setOpen}
    selectedKeys={model.selectedKeys} onSelectionChange={keys => { if (keys !== "all") onValueChange(model.valuesFor(keys)[0] ?? ""); }}
    className={className} classNames={{ base: css.field, label: css.label, mainWrapper: css.main, trigger: css.selectTrigger,
      innerWrapper: css.inner, value: css.selectValue, description: css.description, errorMessage: css.error, selectorIcon: css.selectorIcon }}
    popoverProps={{ classNames: { content: css.menu } }} listboxProps={{ "aria-label": accessibleLabel, classNames: { base: css.listbox }, itemClasses: {
      base: css.option, title: css.optionTitle, description: css.description, selectedIcon: css.selectedIcon,
    } }}>
    {model.options.map(option => <SelectItem key={option.key} textValue={option.label} description={option.description}>{option.label}</SelectItem>)}
  </Select>;
}
