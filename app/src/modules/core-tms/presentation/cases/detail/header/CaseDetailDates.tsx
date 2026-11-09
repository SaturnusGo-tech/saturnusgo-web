import { Button, Tooltip } from "@heroui/react";
import { useRef, useState } from "react";
import { Info } from "lucide-react";
import type { TmsLocale } from "../../../../localization/model/locale";
import styles from "./case-header-overlays.module.css";

export function CaseDetailDates({ createdAt, updatedAt, locale, languageTag }: {
  createdAt: string;
  updatedAt: string;
  locale: TmsLocale;
  languageTag: string;
}) {
  const [open, setOpen] = useState(false);
  const wasOpenBeforeTouch = useRef(false);
  const ru = locale === "ru";
  const label = ru ? "Даты тест-кейса" : "Test case dates";
  const format = new Intl.DateTimeFormat(languageTag, { dateStyle: "medium", timeStyle: "short" });
  const rows = [
    { name: ru ? "Создан" : "Created", value: createdAt },
    { name: ru ? "Обновлён" : "Updated", value: updatedAt },
  ];
  return <Tooltip isOpen={open} onOpenChange={setOpen} placement="bottom-end" offset={5} delay={350} closeDelay={60}
    disableAnimation classNames={{ base: styles.positioner, content: styles.dates }}
    content={<dl>{rows.map(({ name, value }) => <div key={name}>
      <dt>{name}</dt><dd><time dateTime={value}>{format.format(new Date(value))}</time></dd>
    </div>)}</dl>}>
    <Button type="button" isIconOnly variant="light" disableRipple className={styles.dateTrigger} aria-label={label}
      onPointerDownCapture={event => { if (event.pointerType === "touch") wasOpenBeforeTouch.current = open; }}
      onPress={event => { if (event.pointerType === "touch") setOpen(!wasOpenBeforeTouch.current); }}>
      <Info size={15} aria-hidden="true" />
    </Button>
  </Tooltip>;
}
