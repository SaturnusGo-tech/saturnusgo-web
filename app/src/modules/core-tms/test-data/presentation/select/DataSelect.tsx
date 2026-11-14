"use client";
import { Skeleton, type SelectProps } from "@heroui/react";
import { Children, useLayoutEffect, useRef, useState } from "react";
import { AnchoredSelect } from "../../../../../shared/components/anchored-popup/select/AnchoredSelect";
import { IntegrationSelectTrigger } from "../../../presentation/common/integration-controls/select-trigger/IntegrationSelectTrigger";
import css from "../../../presentation/common/integration-controls/styles/integration-controls.module.css";
import fields from "../shared/data.module.css";
import compact from "./select.module.css";

export function DataSelect({ classNames, popoverProps, listboxProps, scrollShadowProps, ...props }: SelectProps) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  const count = props.items ? Array.from(props.items).length : Children.count(typeof props.children === "function" ? null : props.children);
  const [geometry, setGeometry] = useState<{ width?: number; height: number }>({ height: Math.min(8, count || (props.isLoading ? 4 : 1)) * 30 + 8 });
  const isOpen = props.isOpen ?? open;
  function measure() {
    const trigger = root.current?.querySelector<HTMLElement>('[data-slot="trigger"]');
    const rect = trigger?.getBoundingClientRect();
    const available = rect && typeof window !== "undefined" ? Math.max(rect.top, window.innerHeight - rect.bottom) - 24 : 256;
    setGeometry({ width: rect?.width, height: Math.max(30, Math.min(256, available, Math.min(8, count || (props.isLoading ? 4 : 1)) * 30 + 8)) });
  }
  // Controlled/default-open menus are also measured before the browser paints them.
  useLayoutEffect(() => { if (isOpen) measure(); }, [isOpen]);
  function changeOpen(next: boolean) {
    if (next) measure();
    setOpen(next);
    props.onOpenChange?.(next);
  }
  const loading = props.isLoading && count === 0;
  const skeleton = <div className={compact.skeletons} aria-hidden="true">{[0, 1, 2, 3].map(row => <Skeleton key={row} className={compact.skeleton} />)}</div>;
  return <div ref={root} className={compact.root}><AnchoredSelect as={IntegrationSelectTrigger} size="sm" variant="flat" labelPlacement="outside" disableAnimation {...props}
    isOpen={isOpen} onOpenChange={changeOpen} maxListboxHeight={geometry.height} itemHeight={30} isVirtualized={false}
    classNames={{ ...classNames, base: `${css.field} ${fields.fieldControl} ${classNames?.base ?? ""}`, label: `${css.label} ${fields.controlLabel} ${classNames?.label ?? ""}`,
      mainWrapper: `${css.main} ${classNames?.mainWrapper ?? ""}`, trigger: `${css.selectTrigger} ${fields.inputShell} ${classNames?.trigger ?? ""}`,
      innerWrapper: `${css.inner} ${classNames?.innerWrapper ?? ""}`, value: `${css.selectValue} ${fields.input} ${classNames?.value ?? ""}`,
      description: fields.formHint, errorMessage: css.error, selectorIcon: css.selectorIcon }}
    popoverProps={{ ...popoverProps, shouldBlockScroll: false, style: { ...popoverProps?.style, width: geometry.width },
      classNames: { ...popoverProps?.classNames, content: `${css.menu} ${compact.menu} ${popoverProps?.classNames?.content ?? ""}` } }}
    scrollShadowProps={{ ...scrollShadowProps, style: { ...scrollShadowProps?.style, height: geometry.height, maxHeight: geometry.height } }}
    listboxProps={{ ...listboxProps, "aria-busy": Boolean(props.isLoading), emptyContent: loading ? skeleton : listboxProps?.emptyContent,
      classNames: { ...listboxProps?.classNames, base: `${css.listbox} ${compact.listbox}`, list: props.isLoading ? undefined : compact.ready, emptyContent: compact.empty },
      itemClasses: { base: `${css.option} ${compact.option}`, title: `${css.optionTitle} ${compact.title}`, description: css.description, selectedIcon: css.selectedIcon } }} /></div>;
}
