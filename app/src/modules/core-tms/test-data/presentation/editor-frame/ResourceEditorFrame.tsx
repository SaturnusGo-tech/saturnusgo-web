import { Button } from "@heroui/react";
import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { DataModal } from "../shared/DataModal";
import css from "./resource-editor.module.css";

export function ResourceEditorFrame({ inline = false, title, subtitle, onClose, children, ru, busy }: {
  inline?: boolean; title: string; subtitle?: string; onClose(): void; children: ReactNode; ru: boolean; busy?: boolean;
}) {
  const titleId = useId();
  if (!inline) return <DataModal title={title} subtitle={subtitle} onClose={onClose} wide>{children}</DataModal>;
  return <section className={css.frame} role="region" aria-labelledby={titleId} onKeyDown={event => {
    if (event.key !== "Escape" || event.defaultPrevented || busy) return;
    event.preventDefault(); event.stopPropagation(); onClose();
  }}>
    <header className={css.header}>
      <div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      <Button type="button" isIconOnly disableRipple className={css.close} isDisabled={busy}
        aria-label={ru ? "Закрыть редактор" : "Close editor"} onPress={onClose}><X size={18} /></Button>
    </header>
    <div className={css.content}>{children}</div>
  </section>;
}
