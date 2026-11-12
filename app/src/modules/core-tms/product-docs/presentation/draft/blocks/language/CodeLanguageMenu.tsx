import { AnchoredDropdown as Dropdown } from "../../../../../../../shared/components/anchored-popup/dropdown/AnchoredDropdown";
import { DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { ChevronDown, CodeXml } from "lucide-react";
import { productDocLanguageOptions } from "../engine/codeLanguage";
import { ProductDocToolbarButton } from "../../toolbar/menu/ProductDocToolbarMenu";
import styles from "./code-language-menu.module.css";

export function CodeLanguageMenu({ ru, value, disabled, onChange }: {
  ru: boolean;
  value: string;
  disabled: boolean;
  onChange(value: string): void;
}) {
  const label = ru ? "Язык" : "Language";
  const options = productDocLanguageOptions(value, ru ? "Обычный текст" : "Plain text");
  const selected = options.find((option) => option.value === value);
  return <Dropdown placement="bottom-start" classNames={{ base: styles.overlay, content: styles.menu }}>
    <DropdownTrigger>
      <ProductDocToolbarButton label={label} size="sm" radius="full" isDisabled={disabled} className={styles.trigger}
        aria-label={`${label}: ${selected?.label}`}>
        <CodeXml size={13} aria-hidden="true" />
        {selected?.label}
        <ChevronDown size={12} aria-hidden="true" />
      </ProductDocToolbarButton>
    </DropdownTrigger>
    <DropdownMenu aria-label={label} selectionMode="single" disallowEmptySelection
      selectedKeys={[`language:${value}`]} classNames={{ base: styles.listbox, list: styles.list }}
      itemClasses={{ base: styles.option, selectedIcon: styles.selectedIcon }}>
      {options.map((option) => <DropdownItem key={`language:${option.value}`} textValue={option.label}
        onPress={() => onChange(option.value)}>{option.label}</DropdownItem>)}
    </DropdownMenu>
  </Dropdown>;
}
