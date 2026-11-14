import { Button, Listbox, ListboxItem, PopoverContent, PopoverTrigger } from "@heroui/react";
import { ChevronDown, Cloud, FileSpreadsheet, Link } from "lucide-react";
import { useState } from "react";
import { SiMysql, SiPostgresql } from "react-icons/si";
import { AnchoredPopover } from "../../../../../shared/components/anchored-popup/popover/AnchoredPopover";
import type { DataSource } from "../../model/workspace/data-workspace";
import { useTestData } from "../../application/context/TestDataContext";
import css from "./source-menu.module.css";

export function AddSourceMenu({ ru, onChoose, isDisabled = false }: { ru: boolean; isDisabled?: boolean; onChoose(kind: DataSource["kind"] | "EXISTING"): void }) {
  const feature = useTestData(), [open, setOpen] = useState(false);
  const disabled = feature?.permissions.create && feature.permissions.credentialCreate ? [] : ["POSTMAN", "MYSQL", "POSTGRES"];
  if (!feature?.permissions.create) disabled.push("FILE");
  return <AnchoredPopover placement="bottom-start" isOpen={open} onOpenChange={setOpen} shouldBlockScroll={false} offset={5}>
    <PopoverTrigger><Button type="button" disableRipple isDisabled={isDisabled} className={css.trigger} endContent={<ChevronDown size={12} />}>{ru ? "Добавить источник" : "Add source"}</Button></PopoverTrigger>
    <PopoverContent className={css.menu}><Listbox aria-label={ru ? "Выбрать источник данных" : "Choose data source"} disabledKeys={disabled}
      classNames={{ base: css.list }} itemClasses={{ base: css.option, title: css.title }} onAction={key => { if (isDisabled || disabled.includes(String(key))) return; setOpen(false); onChoose(String(key) as DataSource["kind"] | "EXISTING"); }}>
      <ListboxItem key="POSTMAN" startContent={<Cloud size={14} />}>Postman Cloud Store</ListboxItem>
      <ListboxItem key="MYSQL" startContent={<SiMysql size={14} aria-hidden="true" />}>MySQL</ListboxItem>
      <ListboxItem key="POSTGRES" startContent={<SiPostgresql size={14} aria-hidden="true" />}>PostgreSQL</ListboxItem>
      <ListboxItem key="FILE" startContent={<FileSpreadsheet size={14} />}>{ru ? "Импортировать файл" : "Import file"}</ListboxItem>
      <ListboxItem key="EXISTING" startContent={<Link size={14} />}>{ru ? "Существующий источник" : "Existing source"}</ListboxItem>
    </Listbox></PopoverContent>
  </AnchoredPopover>;
}
