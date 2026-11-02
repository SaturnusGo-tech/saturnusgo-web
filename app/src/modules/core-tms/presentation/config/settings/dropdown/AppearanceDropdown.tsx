import { Check, ChevronDown } from "@openai/apps-sdk-ui/components/Icon";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { useAnchoredPopup } from "../../../common/popup/useAnchoredPopup";
import css from "./appearance-dropdown.module.css";

type Option = { value: string; label: string };
type Origin = { x: number; y: number };
type Props = {
  id: string;
  labelledBy: string;
  describedBy: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string, origin: Origin) => void;
};

export function AppearanceDropdown({ id, labelledBy, describedBy, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  const menuId = `${id}-listbox`;
  useAnchoredPopup(open, false, rootRef, triggerRef, menuRef, dismiss);

  function reveal(index = selectedIndex) {
    setActiveIndex(index);
    setOpen(true);
    triggerRef.current?.focus();
  }

  function choose(index: number) {
    const option = options[index];
    const bounds = triggerRef.current?.getBoundingClientRect();
    dismiss();
    triggerRef.current?.focus();
    if (option && bounds) onChange(option.value, { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const { key } = event;
    if (key === "Tab") { dismiss(); return; }
    if (key === "Escape") {
      if (open) { event.preventDefault(); event.stopPropagation(); dismiss(); }
      return;
    }
    if (key === "Enter" || key === " ") {
      event.preventDefault();
      if (open) choose(activeIndex); else reveal();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) return;
    event.preventDefault();
    if (key === "Home") reveal(0);
    else if (key === "End") reveal(options.length - 1);
    else if (!open) reveal();
    else setActiveIndex(index => Math.max(0, Math.min(options.length - 1, index + (key === "ArrowDown" ? 1 : -1))));
  }

  return <div ref={rootRef} className={css.root}>
    <button ref={triggerRef} id={id} type="button" role="combobox" className={css.trigger}
      aria-labelledby={labelledBy} aria-describedby={describedBy} aria-haspopup="listbox" aria-expanded={open}
      aria-controls={menuId} aria-activedescendant={open ? `${menuId}-option-${activeIndex}` : undefined}
      onClick={() => { if (open) dismiss(); else reveal(); }} onKeyDown={handleKeyDown}
      onBlur={event => { if (!rootRef.current?.contains(event.relatedTarget as Node | null)) dismiss(); }}>
      <span>{options[selectedIndex]?.label}</span><ChevronDown width={16} height={16} aria-hidden="true" />
    </button>
    <div ref={menuRef} id={menuId} className={css.menu} popover="manual" role="listbox"
      aria-labelledby={labelledBy} aria-hidden={!open} data-open={open}>
      {options.map((option, index) => <div key={option.value} id={`${menuId}-option-${index}`} role="option"
        aria-selected={option.value === value} data-active={index === activeIndex}
        onPointerMove={() => setActiveIndex(index)} onPointerDown={event => event.preventDefault()}
        onClick={() => choose(index)}>
        <span>{option.label}</span>{option.value === value && <Check width={16} height={16} aria-hidden="true" />}
      </div>)}
    </div>
  </div>;
}
