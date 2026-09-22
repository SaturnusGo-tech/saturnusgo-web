import { useDndContext } from "@dnd-kit/core";
import { PiPlus } from "react-icons/pi";
import css from "../styles/repository.module.css";

export function CaseQuickAdd({ folderPath, onCreate, disabled, ru }: {
  folderPath: string; onCreate: (path: string) => void; disabled: boolean; ru: boolean;
}) {
  const { active } = useDndContext();
  const unavailable = disabled || Boolean(active);
  const label = ru ? "Добавить тест-кейс в эту папку" : "Add test case in this folder";
  return <button type="button" className={css.caseAddButton} disabled={unavailable} aria-label={label} title={label}
    onClick={() => { if (!unavailable) onCreate(folderPath); }}><PiPlus size={16} aria-hidden="true" /></button>;
}
