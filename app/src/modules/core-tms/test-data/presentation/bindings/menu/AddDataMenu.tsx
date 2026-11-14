import { useTestData } from "../../../application/context/TestDataContext";
import { Button, Listbox, ListboxItem, PopoverContent, PopoverTrigger } from "@heroui/react";
import { AnchoredPopover as Popover } from "../../../../../../shared/components/anchored-popup/popover/AnchoredPopover";
import { Plus } from "lucide-react";
import { useState } from "react";
import css from "../../shared/data.module.css";
import controls from "../../../../presentation/common/integration-controls/styles/integration-controls.module.css";
export function AddDataMenu({ ru, onChoose }: { ru: boolean; onChoose(kind: "STATIC" | "DATASET" | "CREDENTIAL"): void }) {
  const feature = useTestData();
  const [open, setOpen] = useState(false);
  return <Popover disableAnimation isOpen={open} onOpenChange={setOpen} placement="bottom-end" shouldBlockScroll={false}>
    <PopoverTrigger><Button className={`${css.button} ${css.quiet}`} startContent={<Plus size={14} />}>{ru ? "Добавить данные" : "Add Test Data"}</Button></PopoverTrigger>
    <PopoverContent className={controls.menu}><Listbox classNames={{ base: controls.listbox }} itemClasses={{ base: `${controls.option} ${css.menuOption}`, title: controls.optionTitle, description: controls.description }} disabledKeys={feature?.permissions.use ? [] : ["CREDENTIAL"]} aria-label={ru ? "Тип тестовых данных" : "Test data source"} onAction={key => { setOpen(false); onChoose(String(key) as "STATIC" | "DATASET" | "CREDENTIAL"); }}>
      <ListboxItem key="STATIC" description={ru ? "Фиксированное значение" : "Add a fixed value"}>Static Data</ListboxItem>
      <ListboxItem key="CREDENTIAL" description={!feature?.permissions.use ? (ru ? "Нет права использования учётных данных" : "Credential use permission is required") : (ru ? "Защищённая тестовая учётная запись" : "Link a protected test account")}>Secure Credentials</ListboxItem>
      <ListboxItem key="DATASET" description={ru ? "Переиспользуемый набор" : "Reuse an existing dataset"}>Shared Dataset</ListboxItem>
    </Listbox></PopoverContent>
  </Popover>;
}
