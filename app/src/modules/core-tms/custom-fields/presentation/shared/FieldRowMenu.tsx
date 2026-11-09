import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { Archive, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";
import css from "./customFields.module.css";

export function FieldRowMenu({ ru, name, archived, disabled, onEdit, onTransition }: {
  ru: boolean; name: string; archived: boolean; disabled: boolean; onEdit(): void; onTransition(): void;
}) {
  const label = `${ru ? "Действия" : "Actions"}: ${name}`;
  return <Dropdown placement="bottom-end" classNames={{ base: css.menuPositioner, content: css.menuSurface }}>
    <DropdownTrigger>
      <Button type="button" size="sm" isIconOnly disableRipple variant="light" className={css.icon}
        isDisabled={disabled} aria-label={label}><MoreHorizontal size={16} aria-hidden="true" /></Button>
    </DropdownTrigger>
    <DropdownMenu aria-label={label} itemClasses={{ base: css.menuItem }}
      onAction={key => { if (key === "edit") onEdit(); else onTransition(); }}>
      <DropdownItem key="edit" startContent={<Pencil size={14} />}>{ru ? "Изменить" : "Edit"}</DropdownItem>
      <DropdownItem key="transition" startContent={archived ? <RotateCcw size={14} /> : <Archive size={14} />}>
        {archived ? (ru ? "Восстановить" : "Restore") : (ru ? "Архивировать" : "Archive")}
      </DropdownItem>
    </DropdownMenu>
  </Dropdown>;
}
