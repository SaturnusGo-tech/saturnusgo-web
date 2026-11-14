import type { SelectProps } from "@heroui/react";
import { AnchoredSelect } from "../../../../../shared/components/anchored-popup/select/AnchoredSelect";
import { IntegrationSelectTrigger } from "../../../presentation/common/integration-controls/select-trigger/IntegrationSelectTrigger";
import css from "../../../presentation/common/integration-controls/styles/integration-controls.module.css";

export function DataSelect({ classNames, popoverProps, listboxProps, ...props }: SelectProps) {
  return <AnchoredSelect as={IntegrationSelectTrigger} size="sm" variant="flat" labelPlacement="outside" disableAnimation {...props}
    classNames={{ ...classNames, base: `${css.field} ${classNames?.base ?? ""}`, label: `${css.label} ${classNames?.label ?? ""}`,
      mainWrapper: `${css.main} ${classNames?.mainWrapper ?? ""}`, trigger: `${css.selectTrigger} ${classNames?.trigger ?? ""}`,
      innerWrapper: `${css.inner} ${classNames?.innerWrapper ?? ""}`, value: `${css.selectValue} ${classNames?.value ?? ""}`,
      description: css.description, errorMessage: css.error, selectorIcon: css.selectorIcon }}
    popoverProps={{ ...popoverProps, classNames: { ...popoverProps?.classNames, content: `${css.menu} ${popoverProps?.classNames?.content ?? ""}` } }}
    listboxProps={{ ...listboxProps, classNames: { ...listboxProps?.classNames, base: css.listbox },
      itemClasses: { base: css.option, title: css.optionTitle, description: css.description, selectedIcon: css.selectedIcon } }} />;
}
